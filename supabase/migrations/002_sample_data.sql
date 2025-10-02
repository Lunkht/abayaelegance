-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
('Abayas', 'Elegant and modest abayas for every occasion', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20black%20abaya%20dress%20modest%20fashion%20islamic%20clothing%20studio%20photography&image_size=square'),
('Hijabs', 'Beautiful hijabs in various styles and colors', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20hijab%20collection%20islamic%20headscarf%20modest%20fashion%20studio%20photography&image_size=square'),
('Accessories', 'Complete your modest look with our accessories', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=islamic%20jewelry%20accessories%20modest%20fashion%20bracelets%20necklaces%20studio%20photography&image_size=square'),
('Prayer Wear', 'Special collection for prayer and worship', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=white%20prayer%20dress%20islamic%20worship%20clothing%20modest%20fashion%20studio%20photography&image_size=square');

-- Insert sample products
INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured, is_active) 
SELECT 
    'Classic Black Abaya',
    'Timeless elegance meets modern comfort in this classic black abaya. Perfect for daily wear and special occasions.',
    129.99,
    99.99,
    c.id,
    ARRAY[
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20black%20abaya%20dress%20modest%20fashion%20islamic%20clothing%20full%20length%20studio%20photography&image_size=portrait_4_3',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=black%20abaya%20dress%20detail%20view%20modest%20fashion%20islamic%20clothing%20studio%20photography&image_size=portrait_4_3'
    ],
    ARRAY['XS', 'S', 'M', 'L', 'XL'],
    ARRAY['Black'],
    25,
    true,
    true
FROM categories c WHERE c.name = 'Abayas';

INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured, is_active) 
SELECT 
    'Embroidered Navy Abaya',
    'Beautiful navy abaya with intricate gold embroidery. A perfect blend of tradition and contemporary style.',
    189.99,
    NULL,
    c.id,
    ARRAY[
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=navy%20blue%20abaya%20dress%20gold%20embroidery%20modest%20fashion%20islamic%20clothing%20studio%20photography&image_size=portrait_4_3',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=navy%20abaya%20embroidery%20detail%20gold%20thread%20modest%20fashion%20studio%20photography&image_size=portrait_4_3'
    ],
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Navy', 'Black'],
    15,
    true,
    true
FROM categories c WHERE c.name = 'Abayas';

INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured, is_active) 
SELECT 
    'Silk Chiffon Hijab',
    'Luxurious silk chiffon hijab that drapes beautifully. Available in multiple colors to match any outfit.',
    34.99,
    24.99,
    c.id,
    ARRAY[
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=silk%20chiffon%20hijab%20headscarf%20modest%20fashion%20islamic%20clothing%20studio%20photography&image_size=square',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20hijab%20collection%20silk%20chiffon%20modest%20fashion%20studio%20photography&image_size=square'
    ],
    ARRAY['One Size'],
    ARRAY['Rose Gold', 'Emerald', 'Burgundy', 'Cream'],
    50,
    true,
    true
FROM categories c WHERE c.name = 'Hijabs';

INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured, is_active) 
SELECT 
    'Modest Maxi Dress',
    'Comfortable and stylish maxi dress perfect for everyday wear. Features long sleeves and modest neckline.',
    79.99,
    59.99,
    c.id,
    ARRAY[
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modest%20maxi%20dress%20long%20sleeves%20islamic%20fashion%20studio%20photography&image_size=portrait_4_3',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=maxi%20dress%20modest%20fashion%20full%20length%20islamic%20clothing%20studio%20photography&image_size=portrait_4_3'
    ],
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Dusty Rose', 'Sage Green', 'Navy'],
    30,
    false,
    true
FROM categories c WHERE c.name = 'Abayas';

INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured, is_active) 
SELECT 
    'Prayer Rug Set',
    'Beautiful prayer rug with matching prayer beads. Perfect for daily prayers and meditation.',
    49.99,
    NULL,
    c.id,
    ARRAY[
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=islamic%20prayer%20rug%20carpet%20geometric%20pattern%20studio%20photography&image_size=landscape_4_3',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=prayer%20beads%20tasbih%20islamic%20accessories%20studio%20photography&image_size=square'
    ],
    ARRAY['One Size'],
    ARRAY['Blue', 'Green', 'Red'],
    20,
    false,
    true
FROM categories c WHERE c.name = 'Prayer Wear';

INSERT INTO products (name, description, price, sale_price, category_id, images, sizes, colors, stock_quantity, is_featured, is_active) 
SELECT 
    'Gold Crescent Necklace',
    'Elegant gold-plated crescent moon necklace. A beautiful symbol of faith and femininity.',
    39.99,
    29.99,
    c.id,
    ARRAY[
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=gold%20crescent%20moon%20necklace%20islamic%20jewelry%20studio%20photography&image_size=square',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=islamic%20jewelry%20gold%20necklace%20crescent%20moon%20pendant%20studio%20photography&image_size=square'
    ],
    ARRAY['One Size'],
    ARRAY['Gold', 'Silver'],
    40,
    true,
    true
FROM categories c WHERE c.name = 'Accessories';

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;