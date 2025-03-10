import {
  BadRequestException,
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

  async findByUser(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { userId, isCheckout: false },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!cart) {
      // Create a new cart for the user if none exists
      return this.create({ userId });
    }

    return cart;
  }

  async findBySession(sessionId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { sessionId, isCheckout: false },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!cart) {
      // Create a new cart for the session if none exists
      return this.create({ sessionId });
    }

    return cart;
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
  ): Promise<Cart> {
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

    // Check if variant exists if provided
    let variant = null;
    if (createCartItemDto.variantId) {
      variant = await this.productVariantRepository.findOne({
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
      existingItem.total = existingItem.price * existingItem.quantity;

      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const price = variant ? variant.price : product.price;

      const newItem = this.cartItemRepository.create({
        cartId,
        productId: createCartItemDto.productId,
        variantId: createCartItemDto.variantId,
        price,
        quantity: createCartItemDto.quantity,
        total: price * createCartItemDto.quantity,
        options: createCartItemDto.options,
        note: createCartItemDto.note,
      });

      await this.cartItemRepository.save(newItem);
      cart.items.push(newItem);
    }

    // Update cart totals
    await this.updateCartTotals(cart);

    return this.findOne(cartId);
  }

  async updateItem(
    cartId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.findOne(cartId);

    const item = cart.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    // Apply updates
    Object.assign(item, updateCartItemDto);

    // Recalculate item total
    item.total = item.price * item.quantity;

    await this.cartItemRepository.save(item);

    // Update cart totals
    await this.updateCartTotals(cart);

    return this.findOne(cartId);
  }

  async removeItem(cartId: string, itemId: string): Promise<Cart> {
    const cart = await this.findOne(cartId);

    const item = cart.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    await this.cartItemRepository.remove(item);

    // Update cart totals
    cart.items = cart.items.filter((item) => item.id !== itemId);
    await this.updateCartTotals(cart);

    return this.findOne(cartId);
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
    // Calculate subtotal
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );

    // Calculate item count
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // For now, simple calculation. In a real app, you'd apply tax, shipping, discounts, etc.
    cart.total = cart.subtotal - cart.discount + cart.tax + cart.shipping;

    await this.cartRepository.save(cart);
  }

  async applyCoupon(cartId: string, couponCode: string): Promise<Cart> {
    const cart = await this.findOne(cartId);

    // In a real app, you'd validate the coupon code and calculate the discount
    // For now, we'll just set the coupon code
    cart.couponCode = couponCode;

    // Mock discount calculation (10% off)
    cart.discount = Number(cart.subtotal) * 0.1;
    cart.total =
      Number(cart.subtotal) -
      Number(cart.discount) +
      Number(cart.tax) +
      Number(cart.shipping);

    await this.cartRepository.save(cart);

    return this.findOne(cartId);
  }

  async removeCoupon(cartId: string): Promise<Cart> {
    const cart = await this.findOne(cartId);

    cart.couponCode = null;
    cart.discount = 0;
    cart.total =
      Number(cart.subtotal) + Number(cart.tax) + Number(cart.shipping);

    await this.cartRepository.save(cart);

    return this.findOne(cartId);
  }

  async checkout(cartId: string): Promise<Cart> {
    const cart = await this.findOne(cartId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cannot checkout an empty cart');
    }

    cart.isCheckout = true;

    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Merge giỏ hàng session vào giỏ hàng user khi đăng nhập
   * @param sessionId ID của phiên làm việc
   * @param userId ID của người dùng
   * @returns Giỏ hàng đã được merge
   */
  async mergeCartsOnLogin(sessionId: string, userId: string): Promise<Cart> {
    // Tìm giỏ hàng dựa trên sessionId
    const sessionCart = await this.cartRepository.findOne({
      where: { sessionId, isCheckout: false },
      relations: ['items', 'items.product', 'items.variant'],
    });

    // Nếu không có giỏ hàng session hoặc giỏ hàng rỗng, không cần merge
    if (!sessionCart || sessionCart.items.length === 0) {
      return this.findByUser(userId);
    }

    // Tìm giỏ hàng dựa trên userId
    const userCart = await this.findByUser(userId);

    // Merge các sản phẩm từ giỏ hàng session sang giỏ hàng user
    for (const item of sessionCart.items) {
      // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng user chưa
      const existingItem = userCart.items.find(
        (userItem) =>
          userItem.productId === item.productId &&
          userItem.variantId === item.variantId,
      );

      if (existingItem) {
        // Nếu sản phẩm đã tồn tại, cập nhật số lượng
        await this.updateItem(userCart.id, existingItem.id, {
          quantity: existingItem.quantity + item.quantity,
        });
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới
        await this.addItem(userCart.id, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          options: item.options,
          note: item.note,
        });
      }
    }

    // Xóa giỏ hàng session sau khi đã merge
    await this.remove(sessionCart.id);

    // Trả về giỏ hàng user đã cập nhật
    return this.findByUser(userId);
  }
}
