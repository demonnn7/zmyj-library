-- ============================================================
-- 逐梦亚军图书馆 - 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================================

-- 1. 创建图书表
CREATE TABLE IF NOT EXISTS books (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    platform TEXT,
    tags TEXT[],
    status TEXT,
    ending TEXT,
    attributes TEXT,
    car TEXT,
    chapters TEXT,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建站点配置表
CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 插入默认管理员
-- 密码: admin123 (bcrypt 加密)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', 'zmyj210602')
ON CONFLICT (username) DO NOTHING;

-- 5. 插入默认配置
INSERT INTO site_config (key, value) 
VALUES ('description', '图书馆使用说明：')
ON CONFLICT (key) DO NOTHING;

-- 6. 插入默认选项
INSERT INTO site_config (key, value) VALUES
('opt_platform', '["lofter","ao3","web","小红书","私站"]'),
('opt_status', '["已完结","未完结","断更"]'),
('opt_ending', '["he","be","oe","自选结局"]'),
('opt_attributes', '["弛龙","龙弛","互攻","无差"]'),
('opt_car', '["√","×"]'),
('opt_chapters', '["一发完","多篇章"]'),
('opt_tags', '["现背","纯爱","破镜重圆/火葬场","末世","刑侦","娱乐圈","校园","师生","群像","包养","论坛体","古风","捡手机","哨向","背德","双性","网黄","fork/cake","ABO","职场","先婚后爱","伯牙子期","赵章","林章","性转","ntr","9号房","穿越"]')
ON CONFLICT (key) DO NOTHING;

-- 7. 插入默认图书数据
INSERT INTO books (id, title, author, platform, tags, status, ending, attributes, car, chapters, link) VALUES
(1, '破镜重圆', '林听', 'lofter', ARRAY['现背', '破镜重圆/火葬场'], '已完结', 'he', '龙弛', '√', '多篇章', '#'),
(2, '盛夏光年', '沈南乔', 'ao3', ARRAY['纯爱', '校园'], '未完结', 'oe', '弛龙', '×', '一发完', '#'),
(3, '时光代理人', '陈一', 'web', ARRAY['破镜重圆/火葬场'], '', 'be', '互攻', '', '', '#'),
(4, '春日迟', '温酒', '小红书', ARRAY['末世'], '自选结局', '', '无差', '', '', '#'),
(5, '落雪满山', '江月', '私站', ARRAY['刑侦'], '', '', '', '', '', '#')
ON CONFLICT (id) DO NOTHING;

-- 8. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_platform ON books(platform);
CREATE INDEX IF NOT EXISTS idx_books_ending ON books(ending);

-- 9. 启用 RLS (行级安全)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- 10. 创建公共访问策略
CREATE POLICY "允许所有人查询图书" ON books FOR SELECT USING (true);
CREATE POLICY "允许所有人查询配置" ON site_config FOR SELECT USING (true);
CREATE POLICY "允许管理员操作" ON books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "允许管理员操作配置" ON site_config FOR ALL USING (auth.role() = 'authenticated');