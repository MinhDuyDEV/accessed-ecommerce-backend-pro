import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    const cart = this.cartRepository.create(createCartDto);
    return this.cartRepository.save(cart);
  }

  async findAll(): Promise<Cart[]> {
    return this.cartRepository.find({
      relations: ['items', 'items.product', 'items.variant'],
    });
  }

  async findOne(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${id} not found`);
    }

    return cart;
  }

  async findByUser(userId: string): Promise<any> {
    const cart = await this.cartRepository.findOne({
      where: { userId, isCheckout: false },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!cart) {
      // Create a new cart for the user if none exists
      const newCart = await this.create({ userId });
      return this.getSimplifiedCart(newCart.id);
    }

    if (cart.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this cart',
      );
    }

    // Trả về giỏ hàng với thông tin tối giản
    return this.getSimplifiedCart(cart.id);
  }

  async update(id: string, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cart = await this.findOne(id);

    // Apply updates
    Object.assign(cart, updateCartDto);

    return this.cartRepository.save(cart);
  }

  async remove(id: string): Promise<void> {
    const cart = await this.findOne(id);
    await this.cartRepository.remove(cart);
  }

  async addItem(
    cartId: string,
    createCartItemDto: CreateCartItemDto,
  ): Promise<any> {
    const cart = await this.findOne(cartId);

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: createCartItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createCartItemDto.productId} not found`,
      );
    }

    // Check if variant exists (now required)
    const variant = await this.productVariantRepository.findOne({
      where: {
        id: createCartItemDto.variantId,
        productId: createCartItemDto.productId,
      },
    });

    if (!variant) {
      throw new NotFoundException(
        `Product variant with ID ${createCartItemDto.variantId} not found`,
      );
    }

    // Check if the item already exists in the cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId === createCartItemDto.productId &&
        item.variantId === createCartItemDto.variantId,
    );

    if (existingItem) {
      // Update quantity if item already exists
      existingItem.quantity += createCartItemDto.quantity;
      // Đảm bảo giá trị total là số thập phân hợp lệ
      existingItem.total = parseFloat(
        (
          parseFloat(String(existingItem.price)) * existingItem.quantity
        ).toFixed(2),
      );

      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item with variant price
      // Đảm bảo giá trị price và total là số thập phân hợp lệ
      const price = parseFloat(String(variant.price));
      const total = parseFloat((price * createCartItemDto.quantity).toFixed(2));

      const newItem = this.cartItemRepository.create({
        cartId,
        productId: createCartItemDto.productId,
        variantId: createCartItemDto.variantId,
        price,
        quantity: createCartItemDto.quantity,
        total,
        options: createCartItemDto.options,
        note: createCartItemDto.note,
      });

      await this.cartItemRepository.save(newItem);
      cart.items.push(newItem);
    }

    // Update cart totals
    await this.updateCartTotals(cart);

    // Trả về giỏ hàng với thông tin tối giản
    return this.getSimplifiedCart(cartId);
  }

  async updateItem(
    cartId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
    user: User,
  ): Promise<any> {
    const cart = await this.findOne(cartId);

    if (cart.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update items in this cart',
      );
    }
    const item = cart.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    // Kiểm tra nếu số lượng dưới 1, xóa sản phẩm khỏi giỏ hàng
    if (
      updateCartItemDto.quantity !== undefined &&
      updateCartItemDto.quantity < 1
    ) {
      return this.removeItem(cartId, itemId);
    }

    // Apply updates
    Object.assign(item, updateCartItemDto);

    // Recalculate item total - đảm bảo giá trị là số thập phân hợp lệ
    item.total = parseFloat(
      (parseFloat(String(item.price)) * item.quantity).toFixed(2),
    );

    await this.cartItemRepository.save(item);

    // Update cart totals
    await this.updateCartTotals(cart);

    // Trả về giỏ hàng với thông tin tối giản
    return this.getSimplifiedCart(cartId);
  }

  async removeItem(cartId: string, itemId: string): Promise<any> {
    const cart = await this.findOne(cartId);

    const itemIndex = cart.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    const item = cart.items[itemIndex];

    // Xóa item khỏi cơ sở dữ liệu
    await this.cartItemRepository.remove(item);

    // Xóa item khỏi mảng cart.items bằng cách sử dụng splice
    // Điều này đảm bảo item bị xóa hoàn toàn khỏi mảng, kể cả khi id đã bị đặt thành undefined
    cart.items.splice(itemIndex, 1);

    console.log('Cart items sau khi xóa:', cart.items);

    // Cập nhật tổng giỏ hàng
    await this.updateCartTotals(cart);

    // Lưu giỏ hàng đã cập nhật
    await this.cartRepository.save(cart);

    // Trả về giỏ hàng đã đơn giản hóa
    return this.getSimplifiedCart(cartId);
  }

  async clearCart(cartId: string): Promise<Cart> {
    const cart = await this.findOne(cartId);

    // Remove all items
    await this.cartItemRepository.remove(cart.items);

    // Reset cart totals
    cart.items = [];
    cart.subtotal = 0;
    cart.total = 0;
    cart.discount = 0;
    cart.tax = 0;
    cart.shipping = 0;
    cart.itemCount = 0;

    await this.cartRepository.save(cart);

    return this.findOne(cartId);
  }

  private async updateCartTotals(cart: Cart): Promise<void> {
    // Calculate subtotal - đảm bảo giá trị là số thập phân hợp lệ
    cart.subtotal = parseFloat(
      cart.items
        .reduce((sum, item) => sum + parseFloat(String(item.total)), 0)
        .toFixed(2),
    );

    // Calculate item count
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Đảm bảo các giá trị khác cũng là số thập phân hợp lệ
    const discount = parseFloat(String(cart.discount || 0));
    const tax = parseFloat(String(cart.tax || 0));
    const shipping = parseFloat(String(cart.shipping || 0));

    // For now, simple calculation. In a real app, you'd apply tax, shipping, discounts, etc.
    cart.total = parseFloat(
      (cart.subtotal - discount + tax + shipping).toFixed(2),
    );

    await this.cartRepository.save(cart);
  }

  async applyCoupon(cartId: string, couponCode: string): Promise<any> {
    const cart = await this.findOne(cartId);

    // In a real app, you'd validate the coupon code and calculate the discount
    // For now, we'll just set the coupon code
    cart.couponCode = couponCode;

    // Mock discount calculation (10% off)
    cart.discount = parseFloat(
      (parseFloat(String(cart.subtotal)) * 0.1).toFixed(2),
    );

    // Đảm bảo các giá trị khác cũng là số thập phân hợp lệ
    const subtotal = parseFloat(String(cart.subtotal));
    const discount = parseFloat(String(cart.discount));
    const tax = parseFloat(String(cart.tax || 0));
    const shipping = parseFloat(String(cart.shipping || 0));

    cart.total = parseFloat((subtotal - discount + tax + shipping).toFixed(2));

    await this.cartRepository.save(cart);

    // Trả về giỏ hàng với thông tin tối giản
    return this.getSimplifiedCart(cartId);
  }

  async removeCoupon(cartId: string): Promise<any> {
    const cart = await this.findOne(cartId);

    cart.couponCode = null;
    cart.discount = 0;

    // Đảm bảo các giá trị khác cũng là số thập phân hợp lệ
    const subtotal = parseFloat(String(cart.subtotal));
    const tax = parseFloat(String(cart.tax || 0));
    const shipping = parseFloat(String(cart.shipping || 0));

    cart.total = parseFloat((subtotal + tax + shipping).toFixed(2));

    await this.cartRepository.save(cart);

    // Trả về giỏ hàng với thông tin tối giản
    return this.getSimplifiedCart(cartId);
  }

  async checkout(cartId: string): Promise<any> {
    const cart = await this.findOne(cartId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cannot checkout an empty cart');
    }

    cart.isCheckout = true;

    await this.cartRepository.save(cart);

    // Trả về giỏ hàng với thông tin tối giản
    return this.getSimplifiedCart(cartId);
  }

  // Phương thức trả về giỏ hàng với thông tin tối giản
  async getSimplifiedCart(cartId: string): Promise<any> {
    const cart = await this.findOne(cartId);

    // Tạo một bản sao của giỏ hàng để tùy chỉnh
    const simplifiedCart = {
      id: cart.id,
      userId: cart.userId,
      subtotal: cart.subtotal,
      total: cart.total,
      discount: cart.discount,
      tax: cart.tax,
      shipping: cart.shipping,
      couponCode: cart.couponCode,
      itemCount: cart.itemCount,
      isCheckout: cart.isCheckout,
      items: cart.items.map((item) => {
        // Chỉ lấy thông tin cần thiết của variant
        const simplifiedVariant = item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              price: item.variant.price,
              options: item.variant.options,
              imageUrl: item.variant.imageUrl,
            }
          : null;

        // Trả về thông tin tối giản của item
        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          options: item.options,
          note: item.note,
          variant: simplifiedVariant,
        };
      }),
    };

    return simplifiedCart;
  }
}
