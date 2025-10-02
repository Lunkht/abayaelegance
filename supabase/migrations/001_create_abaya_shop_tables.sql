-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  category_id UUID REFERENCES categories(id),
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  size VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  size VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color)
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Create policies for products (public read)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (is_active = true);

-- Create policies for orders (users can only see their own)
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for order_items
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items for their orders" ON order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Create policies for cart_items
CREATE POLICY "Users can manage their own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON reviews TO authenticated;

-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
('Traditional Abayas', 'Classic and elegant traditional abayas for everyday wear', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20traditional%20black%20abaya%20on%20mannequin%20in%20boutique%20setting&image_size=square'),
('Modern Abayas', 'Contemporary designs with modern cuts and styles', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20stylish%20abaya%20with%20contemporary%20design%20elements&image_size=square'),
('Occasion Wear', 'Special abayas for weddings, parties, and formal events', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=luxurious%20embellished%20abaya%20for%20special%20occasions&image_size=square'),
('Casual Abayas', 'Comfortable and stylish abayas for daily wear', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=casual%20comfortable%20abaya%20for%20everyday%20wear&image_size=square');

-- Insert sample products
INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured) VALUES
('Elegant Black Abaya', 'Classic black abaya with subtle embroidery details', 299.99, 249.99, (SELECT id FROM categories WHERE name = 'Traditional Abayas'), 
 ARRAY['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20black%20abaya%20with%20embroidery%20details&image_size=portrait_4_3'], 
 ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black'], 25, true),

('Modern Navy Abaya', 'Contemporary navy blue abaya with modern silhouette', 349.99, NULL, (SELECT id FROM categories WHERE name = 'Modern Abayas'), 
 ARRAY['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20navy%20blue%20abaya%20contemporary%20style&image_size=portrait_4_3'], 
 ARRAY['S', 'M', 'L', 'XL'], ARRAY['Navy Blue'], 20, true),

('Golden Embellished Abaya', 'Luxurious abaya with golden embellishments for special occasions', 599.99, 499.99, (SELECT id FROM categories WHERE name = 'Occasion Wear'), 
 ARRAY['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=luxurious%20abaya%20with%20golden%20embellishments%20and%20beading&image_size=portrait_4_3'], 
 ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Dark Green'], 15, true),

('Casual Gray Abaya', 'Comfortable gray abaya perfect for everyday wear', 199.99, NULL, (SELECT id FROM categories WHERE name = 'Casual Abayas'), 
 ARRAY['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=casual%20gray%20abaya%20comfortable%20everyday%20wear&image_size=portrait_4_3'], 
 ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['Gray', 'Light Gray'], 30, false);