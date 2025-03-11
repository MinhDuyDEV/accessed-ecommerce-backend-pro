-- Tạo function để import categories từ JSON
CREATE OR REPLACE FUNCTION import_categories_from_json(json_data JSONB)
RETURNS VOID AS $$
DECLARE
    category RECORD;
    child RECORD;
    category_id UUID;
    parent_id UUID;
BEGIN
    -- Xóa tất cả categories hiện có
    DELETE FROM categories;
    
    -- Import các categories gốc
    FOR category IN SELECT * FROM jsonb_array_elements(json_data)
    LOOP
        -- Insert category gốc
        INSERT INTO categories (
            name, 
            slug, 
            description, 
            image, 
            "order", 
            "isActive", 
            "createdAt", 
            "updatedAt"
        ) VALUES (
            category.value->>'name',
            category.value->>'slug',
            category.value->>'description',
            category.value->>'image',
            (category.value->>'order')::INTEGER,
            (category.value->>'isActive')::BOOLEAN,
            NOW(),
            NOW()
        ) RETURNING id INTO category_id;
        
        -- Import các category con
        IF category.value->'children' IS NOT NULL THEN
            PERFORM import_children(category.value->'children', category_id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function để import các category con
CREATE OR REPLACE FUNCTION import_children(children JSONB, parent_id UUID)
RETURNS VOID AS $$
DECLARE
    child RECORD;
    child_id UUID;
BEGIN
    FOR child IN SELECT * FROM jsonb_array_elements(children)
    LOOP
        -- Insert category con
        INSERT INTO categories (
            name, 
            slug, 
            description, 
            image, 
            "order", 
            "isActive", 
            "parentId",
            "createdAt", 
            "updatedAt"
        ) VALUES (
            child.value->>'name',
            child.value->>'slug',
            child.value->>'description',
            child.value->>'image',
            (child.value->>'order')::INTEGER,
            (child.value->>'isActive')::BOOLEAN,
            parent_id,
            NOW(),
            NOW()
        ) RETURNING id INTO child_id;
        
        -- Import các category con của con
        IF child.value->'children' IS NOT NULL THEN
            PERFORM import_children(child.value->'children', child_id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sử dụng function để import dữ liệu từ file JSON
-- Lưu ý: Bạn cần thay thế đường dẫn file JSON thực tế
-- Ví dụ: SELECT import_categories_from_json(pg_read_file('/path/to/categories.json')::JSONB);

-- Hoặc bạn có thể copy nội dung file JSON vào đây
-- SELECT import_categories_from_json('
-- [
--   {
--     "name": "Thời Trang Nữ",
--     "slug": "thoi-trang-nu",
--     ...
--   },
--   ...
-- ]
-- '::JSONB);

-- Xóa function sau khi sử dụng
-- DROP FUNCTION import_categories_from_json(JSONB);
-- DROP FUNCTION import_children(JSONB, UUID); 