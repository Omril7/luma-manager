-- ────────────────────────────────────────────────────────────────────────────
-- Materials seed data — run in Supabase SQL Editor
-- Replace the user_id below with your actual user UUID
-- (find it in Authentication → Users in the Supabase dashboard)
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  uid uuid := 'aa7cac73-05df-4884-a501-119ffa13c846';  -- ← replace this

  cat_fabrics       uuid;
  cat_threads       uuid;
  cat_buttons       uuid;
  cat_padding       uuid;
  cat_zippers       uuid;
  cat_dyes          uuid;
  cat_packaging     uuid;
  cat_lace          uuid;
  cat_tools         uuid;
  cat_decorations   uuid;
BEGIN

-- ── Categories ───────────────────────────────────────────────────────────────

INSERT INTO material_categories (user_id, name) VALUES (uid, 'בדים')             RETURNING id INTO cat_fabrics;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'חוטים ותפירה')     RETURNING id INTO cat_threads;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'כפתורים ואביזרים') RETURNING id INTO cat_buttons;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'ריפוד ומילוי')     RETURNING id INTO cat_padding;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'רוכסנים ותפסים')   RETURNING id INTO cat_zippers;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'צבעים וטיפול בד')  RETURNING id INTO cat_dyes;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'אריזה ואספקה')     RETURNING id INTO cat_packaging;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'תחרות וסרטים')     RETURNING id INTO cat_lace;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'כלי עבודה')        RETURNING id INTO cat_tools;
INSERT INTO material_categories (user_id, name) VALUES (uid, 'קישוטים ועיצוב')   RETURNING id INTO cat_decorations;

-- ── בדים (Fabrics) ────────────────────────────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_fabrics, 'כותנה לבנה 100%',      'מטר',    28.00),
  (uid, cat_fabrics, 'כותנה מודפסת',          'מטר',    42.00),
  (uid, cat_fabrics, 'פוליאסטר חלק',          'מטר',    18.50),
  (uid, cat_fabrics, 'ג׳ינס כחול',            'מטר',    55.00),
  (uid, cat_fabrics, 'קטיפה',                 'מטר',    85.00),
  (uid, cat_fabrics, 'בד פשתן',               'מטר',    62.00),
  (uid, cat_fabrics, 'בד טול',                'מטר',    14.00),
  (uid, cat_fabrics, 'קנבס כבד',              'מטר',    45.00),
  (uid, cat_fabrics, 'שיפון',                 'מטר',    38.00),
  (uid, cat_fabrics, 'בד עמיד למים',          'מטר',    72.00),
  (uid, cat_fabrics, 'צמר לבד',               'מטר',    90.00);

-- ── חוטים ותפירה (Threads) ────────────────────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_threads, 'חוט תפירה לבן',         'ספול',   6.50),
  (uid, cat_threads, 'חוט תפירה שחור',         'ספול',   6.50),
  (uid, cat_threads, 'חוט תפירה צבעוני',       'ספול',   8.00),
  (uid, cat_threads, 'חוט רקמה כותנה',         'חבילה',  24.00),
  (uid, cat_threads, 'חוט צמר עבה',            'כדור',   35.00),
  (uid, cat_threads, 'חוט מטאלי',              'ספול',   12.00),
  (uid, cat_threads, 'חוט לכריכת כפתורים',     'ספול',   9.00),
  (uid, cat_threads, 'חוט ניילון שקוף',        'ספול',   7.50),
  (uid, cat_threads, 'חוט אלסטי',             'מטר',    2.00),
  (uid, cat_threads, 'חוט קרושה',              'כדור',   28.00),
  (uid, cat_threads, 'חוט משי',                'ספול',   18.00);

-- ── כפתורים ואביזרים (Buttons & Accessories) ─────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_buttons, 'כפתור עץ קטן',          'יחידה',  1.20),
  (uid, cat_buttons, 'כפתור עץ גדול',          'יחידה',  2.50),
  (uid, cat_buttons, 'כפתור פלסטיק עגול',      'יחידה',  0.80),
  (uid, cat_buttons, 'כפתור מתכת',             'יחידה',  3.50),
  (uid, cat_buttons, 'כפתור ציפורן',           'יחידה',  1.80),
  (uid, cat_buttons, 'אבזם מרובע',             'יחידה',  4.00),
  (uid, cat_buttons, 'וו ועין',                'זוג',    1.50),
  (uid, cat_buttons, 'לחצן מתכת',              'יחידה',  2.20),
  (uid, cat_buttons, 'לחצן פלסטיק',            'יחידה',  1.00),
  (uid, cat_buttons, 'טבעת D מתכת',            'יחידה',  2.80),
  (uid, cat_buttons, 'נצרן',                   'יחידה',  0.60);

-- ── ריפוד ומילוי (Padding & Filling) ─────────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_padding, 'סיבי פוליאסטר',          'ק״ג',    22.00),
  (uid, cat_padding, 'ספוג עבה 5 ס״מ',         'יחידה',  45.00),
  (uid, cat_padding, 'ספוג דק 2 ס״מ',          'יחידה',  28.00),
  (uid, cat_padding, 'כותנה גפנים',             'ק״ג',    55.00),
  (uid, cat_padding, 'טמבונין',                'מטר',    18.00),
  (uid, cat_padding, 'בד דבק חיזוק',           'מטר',    32.00),
  (uid, cat_padding, 'ספוג מקצף',              'גליון',  38.00),
  (uid, cat_padding, 'סיבי במבוק',             'ק״ג',    68.00),
  (uid, cat_padding, 'לול כבשים',               'ק״ג',    95.00),
  (uid, cat_padding, 'ריפוד לציפה',            'מטר',    42.00);

-- ── רוכסנים ותפסים (Zippers & Fasteners) ────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_zippers, 'רוכסן ניילון 20 ס״מ',   'יחידה',  3.50),
  (uid, cat_zippers, 'רוכסן ניילון 40 ס״מ',   'יחידה',  5.00),
  (uid, cat_zippers, 'רוכסן ניילון 60 ס״מ',   'יחידה',  7.00),
  (uid, cat_zippers, 'רוכסן מתכת 20 ס״מ',     'יחידה',  6.50),
  (uid, cat_zippers, 'רוכסן נסתר',             'יחידה',  8.00),
  (uid, cat_zippers, 'רוכסן עמיד למים',        'יחידה',  12.00),
  (uid, cat_zippers, 'סגר סקוטש',              'מטר',    8.50),
  (uid, cat_zippers, 'פאר לחץ',                'רצועה',  4.00),
  (uid, cat_zippers, 'הדקי ברזנט',             'אריזה',  15.00),
  (uid, cat_zippers, 'קליפ פלסטיק',            'יחידה',  1.80),
  (uid, cat_zippers, 'טבעת O מתכת 2 ס״מ',     'יחידה',  1.50);

-- ── צבעים וטיפול בד (Dyes & Fabric Treatment) ────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_dyes, 'צבע בד קר אדום',           'בקבוק',  32.00),
  (uid, cat_dyes, 'צבע בד קר כחול',           'בקבוק',  32.00),
  (uid, cat_dyes, 'צבע בד קר שחור',           'בקבוק',  32.00),
  (uid, cat_dyes, 'צבע בד ריסוס',             'קופסה',  48.00),
  (uid, cat_dyes, 'צבע עיפרון לבד',           'יחידה',  18.00),
  (uid, cat_dyes, 'חומר הגנה מים',            'בקבוק',  55.00),
  (uid, cat_dyes, 'נוזל אנטי-קמטים',          'בקבוק',  28.00),
  (uid, cat_dyes, 'גלאיטר בד',                'צנצנת',  22.00),
  (uid, cat_dyes, 'פיגמנט זהב',               'צנצנת',  45.00),
  (uid, cat_dyes, 'חומר בד נגד כתמים',        'תרסיס',  38.00);

-- ── אריזה ואספקה (Packaging) ─────────────────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_packaging, 'שקית אורגנזה קטנה',   'יחידה',  2.50),
  (uid, cat_packaging, 'שקית אורגנזה גדולה',   'יחידה',  4.00),
  (uid, cat_packaging, 'קופסת קרטון S',         'יחידה',  3.50),
  (uid, cat_packaging, 'קופסת קרטון M',         'יחידה',  5.50),
  (uid, cat_packaging, 'קופסת קרטון L',         'יחידה',  8.00),
  (uid, cat_packaging, 'נייר טישו',             'גיליון', 0.50),
  (uid, cat_packaging, 'סרט סאטן אריזה',        'מטר',    1.80),
  (uid, cat_packaging, 'בועיות אריזה',          'מטר',    6.00),
  (uid, cat_packaging, 'תג מחיר קרטון',         'יחידה',  0.30),
  (uid, cat_packaging, 'מדבקת לוגו',            'יחידה',  0.80),
  (uid, cat_packaging, 'שקית ניילון שקוף',      'יחידה',  0.60);

-- ── תחרות וסרטים (Lace & Ribbons) ────────────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_lace, 'תחרה לבנה 2 ס״מ',          'מטר',    4.50),
  (uid, cat_lace, 'תחרה לבנה 5 ס״מ',          'מטר',    8.00),
  (uid, cat_lace, 'סרט סאטן צר',              'מטר',    2.50),
  (uid, cat_lace, 'סרט סאטן רחב',             'מטר',    5.00),
  (uid, cat_lace, 'סרט גרוגרן',               'מטר',    3.50),
  (uid, cat_lace, 'סרט קטיפה',                'מטר',    6.00),
  (uid, cat_lace, 'תחרה שחורה',               'מטר',    5.50),
  (uid, cat_lace, 'בד רשת',                   'מטר',    12.00),
  (uid, cat_lace, 'סרט בד מודפס',             'מטר',    7.00),
  (uid, cat_lace, 'סרט כסף מטאלי',            'מטר',    9.00),
  (uid, cat_lace, 'פומפום מיני',              'יחידה',  1.20);

-- ── כלי עבודה (Tools) ────────────────────────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_tools, 'מחט תפירה יד',             'יחידה',  0.50),
  (uid, cat_tools, 'מחטי מכונה 80/12',         'אריזה',  18.00),
  (uid, cat_tools, 'סיכות תפירה',              'אריזה',  8.00),
  (uid, cat_tools, 'גיר בדים',                 'יחידה',  6.00),
  (uid, cat_tools, 'סרגל תפירה 50 ס״מ',        'יחידה',  22.00),
  (uid, cat_tools, 'פלדת חיתוך',               'יחידה',  35.00),
  (uid, cat_tools, 'גלגלת חיתוך',              'יחידה',  45.00),
  (uid, cat_tools, 'כרית חיתוך A3',            'יחידה',  85.00),
  (uid, cat_tools, 'אגרפן בדים',               'יחידה',  3.50),
  (uid, cat_tools, 'סיכות בטיחות',             'אריזה',  12.00),
  (uid, cat_tools, 'תופסנים',                  'יחידה',  4.50);

-- ── קישוטים ועיצוב (Decorations & Design) ────────────────────────────────────

INSERT INTO materials (user_id, category_id, name, unit, price) VALUES
  (uid, cat_decorations, 'פרח בד קטן',         'יחידה',  2.00),
  (uid, cat_decorations, 'פרח בד גדול',        'יחידה',  4.50),
  (uid, cat_decorations, 'אבן קריסטל',         'יחידה',  1.80),
  (uid, cat_decorations, 'פייטים כסף',         'גרם',    0.90),
  (uid, cat_decorations, 'פייטים זהב',         'גרם',    0.90),
  (uid, cat_decorations, 'חרוזים מעורבים',     'גרם',    0.60),
  (uid, cat_decorations, 'מסגרת מתכת קטנה',   'יחידה',  8.50),
  (uid, cat_decorations, 'קמע עץ',             'יחידה',  5.00),
  (uid, cat_decorations, 'תיל ברונזה',         'מטר',    3.00),
  (uid, cat_decorations, 'מחרוזת פנינים',      'שרשרת',  18.00),
  (uid, cat_decorations, 'כוכב קישוט',         'יחידה',  1.50);

END $$;
