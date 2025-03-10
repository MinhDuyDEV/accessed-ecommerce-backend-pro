import { Permission } from 'src/modules/auth/entities/permission.entity';
import { Policy, PolicyEffect } from 'src/modules/auth/entities/policy.entity';
import { Role } from 'src/modules/auth/entities/role.entity';
import { Connection } from 'typeorm';

export const seedRBAC = async (connection: Connection) => {
  // Tạo permissions
  const permissionsData = [
    // User permissions
    {
      name: 'Create User',
      description: 'Can create new users',
      code: 'user:create',
    },
    {
      name: 'Read User',
      description: 'Can read user details',
      code: 'user:read',
    },
    {
      name: 'Update User',
      description: 'Can update user details',
      code: 'user:update',
    },
    {
      name: 'Delete User',
      description: 'Can delete users',
      code: 'user:delete',
    },

    // Role permissions
    {
      name: 'Create Role',
      description: 'Can create roles',
      code: 'role:create',
    },
    {
      name: 'Read Role',
      description: 'Can read role details',
      code: 'role:read',
    },
    {
      name: 'Update Role',
      description: 'Can update roles',
      code: 'role:update',
    },
    {
      name: 'Delete Role',
      description: 'Can delete roles',
      code: 'role:delete',
    },

    // Permission permissions
    {
      name: 'Create Permission',
      description: 'Can create permissions',
      code: 'permission:create',
    },
    {
      name: 'Read Permission',
      description: 'Can read permission details',
      code: 'permission:read',
    },
    {
      name: 'Update Permission',
      description: 'Can update permissions',
      code: 'permission:update',
    },
    {
      name: 'Delete Permission',
      description: 'Can delete permissions',
      code: 'permission:delete',
    },

    // Policy permissions
    {
      name: 'Create Policy',
      description: 'Can create policies',
      code: 'policy:create',
    },
    {
      name: 'Read Policy',
      description: 'Can read policy details',
      code: 'policy:read',
    },
    {
      name: 'Update Policy',
      description: 'Can update policies',
      code: 'policy:update',
    },
    {
      name: 'Delete Policy',
      description: 'Can delete policies',
      code: 'policy:delete',
    },

    // Shop permissions
    {
      name: 'Create Shop',
      description: 'Can create shops',
      code: 'shop:create',
    },
    {
      name: 'Read Shop',
      description: 'Can read shop details',
      code: 'shop:read',
    },
    {
      name: 'Update Shop',
      description: 'Can update shops',
      code: 'shop:update',
    },
    {
      name: 'Delete Shop',
      description: 'Can delete shops',
      code: 'shop:delete',
    },
    {
      name: 'Verify Shop',
      description: 'Can verify shops',
      code: 'shop:verify',
    },
    {
      name: 'Update Shop Status',
      description: 'Can update shop status',
      code: 'shop:update-status',
    },
    {
      name: 'Feature Shop',
      description: 'Can feature shops',
      code: 'shop:feature',
    },
    {
      name: 'Manage Shop Settings',
      description: 'Can manage shop settings',
      code: 'shop:manage-settings',
    },
    {
      name: 'View Shop Analytics',
      description: 'Can view shop analytics',
      code: 'shop:view-analytics',
    },
    {
      name: 'Manage Shop Staff',
      description: 'Can manage shop staff',
      code: 'shop:manage-staff',
    },
    {
      name: 'Manage Shop Categories',
      description: 'Can manage shop categories',
      code: 'shop:manage-categories',
    },

    // Product permissions
    {
      name: 'Create Product',
      description: 'Can create products',
      code: 'product:create',
    },
    {
      name: 'Read Product',
      description: 'Can read product details',
      code: 'product:read',
    },
    {
      name: 'Update Product',
      description: 'Can update products',
      code: 'product:update',
    },
    {
      name: 'Delete Product',
      description: 'Can delete products',
      code: 'product:delete',
    },

    // Order permissions
    {
      name: 'Create Order',
      description: 'Can create orders',
      code: 'order:create',
    },
    {
      name: 'Read Order',
      description: 'Can read order details',
      code: 'order:read',
    },
    {
      name: 'Update Order',
      description: 'Can update orders',
      code: 'order:update',
    },
    {
      name: 'Delete Order',
      description: 'Can delete orders',
      code: 'order:delete',
    },

    // Address permissions
    {
      name: 'Create Address',
      description: 'Can create addresses',
      code: 'address:create',
    },
    {
      name: 'Read Address',
      description: 'Can read address details',
      code: 'address:read',
    },
    {
      name: 'Update Address',
      description: 'Can update addresses',
      code: 'address:update',
    },
    {
      name: 'Delete Address',
      description: 'Can delete addresses',
      code: 'address:delete',
    },

    // Category permissions
    {
      name: 'Create Category',
      description: 'Can create categories',
      code: 'category:create',
    },
    {
      name: 'Read Category',
      description: 'Can read category details',
      code: 'category:read',
    },
    {
      name: 'Update Category',
      description: 'Can update categories',
      code: 'category:update',
    },
    {
      name: 'Delete Category',
      description: 'Can delete categories',
      code: 'category:delete',
    },
  ];

  const permissionRepository = connection.getRepository(Permission);
  const existingPermissions = await permissionRepository.find();

  // Chỉ tạo permissions nếu chưa tồn tại
  for (const permData of permissionsData) {
    const exists = existingPermissions.some((p) => p.code === permData.code);
    if (!exists) {
      await permissionRepository.save(permissionRepository.create(permData));
    }
  }

  // Lấy tất cả permissions đã tạo
  const permissions = await permissionRepository.find();

  // Tạo roles
  const roleRepository = connection.getRepository(Role);
  const existingRoles = await roleRepository.find();

  // Admin role
  if (!existingRoles.some((r) => r.name === 'admin')) {
    const adminRole = roleRepository.create({
      name: 'admin',
      description: 'Administrator with full access',
      permissions: permissions, // Admin có tất cả permissions
    });
    await roleRepository.save(adminRole);
  }

  // Seller role
  if (!existingRoles.some((r) => r.name === 'seller')) {
    const sellerPermissions = permissions.filter(
      (p) =>
        p.code.startsWith('product:') ||
        p.code === 'shop:read' ||
        p.code === 'shop:update' ||
        p.code === 'shop:manage-settings' ||
        p.code === 'shop:view-analytics' ||
        p.code === 'shop:manage-categories' ||
        p.code === 'category:read' ||
        p.code === 'order:read' ||
        p.code === 'order:update',
    );

    const sellerRole = roleRepository.create({
      name: 'seller',
      description: 'Seller with product management access',
      permissions: sellerPermissions,
    });
    await roleRepository.save(sellerRole);
  }

  // Customer role
  if (!existingRoles.some((r) => r.name === 'customer')) {
    const customerPermissions = permissions.filter(
      (p) =>
        p.code === 'product:read' ||
        p.code === 'shop:read' ||
        p.code === 'order:create' ||
        p.code === 'order:read' ||
        p.code === 'address:create' ||
        p.code === 'address:read' ||
        p.code === 'address:update' ||
        p.code === 'address:delete',
    );

    const customerRole = roleRepository.create({
      name: 'customer',
      description: 'Regular customer',
      permissions: customerPermissions,
    });
    await roleRepository.save(customerRole);
  }

  // Shop Admin role
  if (!existingRoles.some((r) => r.name === 'shop_admin')) {
    const shopAdminPermissions = permissions.filter(
      (p) =>
        p.code.startsWith('product:') ||
        (p.code.startsWith('shop:') &&
          p.code !== 'shop:verify' &&
          p.code !== 'shop:update-status') ||
        p.code.startsWith('order:') ||
        p.code === 'address:read',
    );

    const shopAdminRole = roleRepository.create({
      name: 'shop_admin',
      description: 'Shop administrator with full shop management access',
      permissions: shopAdminPermissions,
    });
    await roleRepository.save(shopAdminRole);
  }

  // Tạo ABAC policies
  const policyRepository = connection.getRepository(Policy);
  const existingPolicies = await policyRepository.find();

  // Policy: Chỉ verified sellers mới có thể tạo sản phẩm
  if (
    !existingPolicies.some((p) => p.name === 'verified-seller-create-product')
  ) {
    const verifiedSellerPolicy = policyRepository.create({
      name: 'verified-seller-create-product',
      description: 'Only verified sellers can create products',
      conditions: {
        and: [
          { contains: ['user.roles', 'seller'] },
          { eq: ['user.isVerifiedSeller', true] },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['product'],
      actions: ['create'],
    });
    await policyRepository.save(verifiedSellerPolicy);
  }

  // Policy: Người dùng chỉ có thể xem đơn hàng của chính họ
  if (!existingPolicies.some((p) => p.name === 'user-view-own-orders')) {
    const viewOwnOrdersPolicy = policyRepository.create({
      name: 'user-view-own-orders',
      description: 'Users can only view their own orders',
      conditions: {
        or: [
          { contains: ['user.roles', 'admin'] },
          { eq: ['user.id', 'context.params.userId'] },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['order'],
      actions: ['read'],
    });
    await policyRepository.save(viewOwnOrdersPolicy);
  }

  // Policy: Người bán chỉ có thể xem đơn hàng của cửa hàng của họ
  if (!existingPolicies.some((p) => p.name === 'seller-view-shop-orders')) {
    const sellerViewShopOrdersPolicy = policyRepository.create({
      name: 'seller-view-shop-orders',
      description: 'Sellers can only view orders for their shop',
      conditions: {
        or: [
          { contains: ['user.roles', 'admin'] },
          {
            and: [
              { contains: ['user.roles', 'seller'] },
              { eq: ['user.shop.id', 'context.params.shopId'] },
            ],
          },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['order'],
      actions: ['read', 'update'],
    });
    await policyRepository.save(sellerViewShopOrdersPolicy);
  }

  // Policy: Người bán chỉ có thể cập nhật cửa hàng của họ
  if (!existingPolicies.some((p) => p.name === 'seller-update-own-shop')) {
    const sellerUpdateOwnShopPolicy = policyRepository.create({
      name: 'seller-update-own-shop',
      description: 'Sellers can only update their own shop',
      conditions: {
        or: [
          { contains: ['user.roles', 'admin'] },
          { eq: ['user.id', 'context.params.ownerId'] },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['shop'],
      actions: ['update'],
    });
    await policyRepository.save(sellerUpdateOwnShopPolicy);
  }

  // Policy: Người dùng chỉ có thể xem và quản lý địa chỉ của chính họ
  if (!existingPolicies.some((p) => p.name === 'user-manage-own-addresses')) {
    const manageOwnAddressesPolicy = policyRepository.create({
      name: 'user-manage-own-addresses',
      description: 'Users can only view and manage their own addresses',
      conditions: {
        or: [
          { contains: ['user.roles', 'admin'] },
          { eq: ['user.id', 'context.params.userId'] },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['address'],
      actions: ['create', 'read', 'update', 'delete'],
    });
    await policyRepository.save(manageOwnAddressesPolicy);
  }

  // Policy: Chỉ shop owner hoặc shop admin mới có thể quản lý shop staff
  if (!existingPolicies.some((p) => p.name === 'manage-shop-staff')) {
    const manageShopStaffPolicy = policyRepository.create({
      name: 'manage-shop-staff',
      description: 'Only shop owner or shop admin can manage shop staff',
      conditions: {
        or: [
          { contains: ['user.roles', 'admin'] },
          {
            and: [
              {
                or: [
                  { contains: ['user.roles', 'shop_admin'] },
                  { eq: ['user.id', 'context.shop.ownerId'] },
                ],
              },
              { eq: ['context.shop.id', 'context.params.shopId'] },
            ],
          },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['shop'],
      actions: ['manage-staff'],
    });
    await policyRepository.save(manageShopStaffPolicy);
  }

  // Policy: Chỉ shop owner, shop admin hoặc admin mới có thể xem analytics của shop
  if (!existingPolicies.some((p) => p.name === 'view-shop-analytics')) {
    const viewShopAnalyticsPolicy = policyRepository.create({
      name: 'view-shop-analytics',
      description:
        'Only shop owner, shop admin or admin can view shop analytics',
      conditions: {
        or: [
          { contains: ['user.roles', 'admin'] },
          {
            and: [
              {
                or: [
                  { contains: ['user.roles', 'shop_admin'] },
                  { eq: ['user.id', 'context.shop.ownerId'] },
                ],
              },
              { eq: ['context.shop.id', 'context.params.shopId'] },
            ],
          },
        ],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['shop'],
      actions: ['view-analytics'],
    });
    await policyRepository.save(viewShopAnalyticsPolicy);
  }

  // Policy: Chỉ admin mới có thể verify shop hoặc thay đổi trạng thái shop
  if (!existingPolicies.some((p) => p.name === 'admin-manage-shop-status')) {
    const adminManageShopStatusPolicy = policyRepository.create({
      name: 'admin-manage-shop-status',
      description: 'Only admin can verify shop or change shop status',
      conditions: {
        contains: ['user.roles', 'admin'],
      },
      effect: PolicyEffect.ALLOW,
      resources: ['shop'],
      actions: ['verify', 'update-status'],
    });
    await policyRepository.save(adminManageShopStatusPolicy);
  }

  console.log('RBAC and ABAC seed completed');
};
