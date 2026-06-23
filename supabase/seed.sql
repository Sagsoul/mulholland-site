-- ============================================================
-- Mulholland Traders — Seed Data
-- ============================================================

-- ============================================================
-- CATEGORIES
-- ============================================================

insert into categories (slug, name, sort_order) values
  ('second-hand',    'Second-Hand Goods',    0),
  ('pipe-repair',    'Pipe Repair',           1),
  ('roof-repair',    'Roof Repair',           2),
  ('paint',          'Paint & Coatings',      3),
  ('rust-converter', 'Rust Converter',        4),
  ('hardware',       'Hardware',              5)
on conflict (slug) do nothing;

-- ============================================================
-- SAMPLE SECOND-HAND PRODUCTS (stock_qty = 1)
-- ============================================================

insert into products (sku, name, description, category_id, price_usd, stock_qty, is_second_hand, is_active) values
  ('SH-001', 'Makita Drill 18V (Cordless)', 'Good condition, includes one battery and charger. Minor scuffs on body.',
    (select id from categories where slug = 'second-hand'), 65.00, 1, true, true),
  ('SH-002', 'Bosch Angle Grinder 115mm', 'Working order. Includes grinding and cutting disc.',
    (select id from categories where slug = 'second-hand'), 35.00, 1, true, true),
  ('SH-003', 'Steel Scaffolding Frame Set (4 frames)', '4 x 1.2m standard frames, some surface rust but structurally sound.',
    (select id from categories where slug = 'second-hand'), 120.00, 1, true, true),
  ('SH-004', 'Galvanised Water Tank 500L', 'Used once. Minor dent on side, no leaks.',
    (select id from categories where slug = 'second-hand'), 180.00, 1, true, true),
  ('SH-005', 'Pressure Washer 1600W', 'Functional. Includes lance and hose. One nozzle missing.',
    (select id from categories where slug = 'second-hand'), 90.00, 1, true, true),
  ('SH-006', 'Aluminium Extension Ladder 6m', 'Good condition. Rubber feet intact.',
    (select id from categories where slug = 'second-hand'), 110.00, 1, true, true),
  ('SH-007', 'Bench Vise 4-inch', 'Heavy cast iron, solid working order.',
    (select id from categories where slug = 'second-hand'), 45.00, 1, true, true),
  ('SH-008', 'Electric Tile Cutter 600W', 'Used but works perfectly. Includes spare blade.',
    (select id from categories where slug = 'second-hand'), 55.00, 1, true, true)
on conflict (sku) do nothing;

-- ============================================================
-- PRICELIST CATEGORIES + ROWS
-- ============================================================

-- FIBERFIX
insert into pricelist_categories (id, name, sort_order) values
  ('00000000-0000-0000-0001-000000000001', 'FIBERFIX – Fibreglass & Resin Bandage', 1)
on conflict (id) do update set name = excluded.name;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0001-000000000001', 'AFPFF5015',   'Fiberglass & resin bandage', '50mm × 1.5 metres',   'ea', 23.50, 1),
  ('00000000-0000-0000-0001-000000000001', 'AFPFF10015',  'Fiberglass & resin bandage', '100mm × 1.5 metres',  'ea', 37.50, 2),
  ('00000000-0000-0000-0001-000000000001', 'AFPFF10025',  'Fiberglass & resin bandage', '100mm × 2.5 metres',  'ea', 43.50, 3),
  ('00000000-0000-0000-0001-000000000001', 'AFPFF10036',  'Fiberglass & resin bandage', '100mm × 3.6 metres',  'ea', 68.50, 4),
  ('00000000-0000-0000-0001-000000000001', 'AFPFF10048',  'Fiberglass & resin bandage', '100mm × 4.8 metres',  'ea', 80.00, 5),
  ('00000000-0000-0000-0001-000000000001', 'AFPFF10065',  'Fiberglass & resin bandage', '100mm × 6.5 metres',  'ea', 94.50, 6),
  ('00000000-0000-0000-0001-000000000001', 'AFPFF100150', 'Fiberglass & resin bandage', '100mm × 15.2 metres', 'ea', 200.50, 7);

-- FIBASTRIP
insert into pricelist_categories (id, name, note, sort_order) values
  ('00000000-0000-0000-0002-000000000001', 'FIBASTRIP – Butyl Tape with Cloth Membrane', null, 2)
on conflict (id) do update set name = excluded.name, note = excluded.note;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0002-000000000001', null, 'RETAIL PACKAGING',  '30mm × 3 mt',  'ea', 25.00, 1),
  ('00000000-0000-0000-0002-000000000001', null, 'COMMERCIAL ROLLS',  '30mm × 15 mt', 'ea', 35.00, 2),
  ('00000000-0000-0000-0002-000000000001', null, 'COMMERCIAL ROLLS',  '50mm × 15 mt', 'ea', 49.50, 3),
  ('00000000-0000-0000-0002-000000000001', null, 'COMMERCIAL ROLLS',  '70mm × 15 mt', 'ea', 67.00, 4);

-- ALL PROOF COATINGS — Rubberguard Normal (Black)
insert into pricelist_categories (id, name, sort_order) values
  ('00000000-0000-0000-0003-000000000001', 'ALL PROOF COATINGS – Rubberguard Normal (Black)', 3)
on conflict (id) do update set name = excluded.name;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0003-000000000001', 'RGN-0002-001',     'Rubberguard Normal (Black)', '1L',   'ea', 15.00,  1),
  ('00000000-0000-0000-0003-000000000001', 'RGN-0002-002.5',   'Rubberguard Normal (Black)', '2.5L', 'ea', 33.50,  2),
  ('00000000-0000-0000-0003-000000000001', 'RGN-0002-005',     'Rubberguard Normal (Black)', '5L',   'ea', 64.00,  3),
  ('00000000-0000-0000-0003-000000000001', 'RGN-0002-020',     'Rubberguard Normal (Black)', '20L',  'ea', 242.50, 4);

-- Rubberguard Fine (Brush/Spray – Black)
insert into pricelist_categories (id, name, note, sort_order) values
  ('00000000-0000-0000-0004-000000000001', 'Rubberguard Fine (Brush/Spray – Black)', 'Spray-able through most stone-chip guns', 4)
on conflict (id) do update set name = excluded.name, note = excluded.note;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0004-000000000001', 'RGF-0001-001', 'Rubberguard Fine – Stonechip spray gun bottle', '1L',  'ea', 20.00,  1),
  ('00000000-0000-0000-0004-000000000001', 'RGF-0002-005', 'Rubberguard Fine – Brush/Spray',               '5L',  'ea', 82.50,  2),
  ('00000000-0000-0000-0004-000000000001', 'RGF-0002-020', 'Rubberguard Fine – Brush/Spray',               '20L', 'ea', 299.00, 3);

-- Rubberguard Smooth
insert into pricelist_categories (id, name, note, sort_order) values
  ('00000000-0000-0000-0005-000000000001', 'Rubberguard Smooth', 'Comes in basic colours; 1L MOQ – box of 12', 5)
on conflict (id) do update set name = excluded.name, note = excluded.note;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0005-000000000001', 'RGS-0002-005', 'Rubberguard Smooth', '5L',  'ea', 74.50,  1),
  ('00000000-0000-0000-0005-000000000001', 'RGS-0002-020', 'Rubberguard Smooth', '20L', 'ea', 277.50, 2);

-- Beecool Heat Reflective Roofing Paint
insert into pricelist_categories (id, name, note, sort_order) values
  ('00000000-0000-0000-0006-000000000001', 'Beecool Heat Reflective Roofing Paint', 'Colour matching available; some colours surcharge', 6)
on conflict (id) do update set name = excluded.name, note = excluded.note;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0006-000000000001', 'ARP-0005-001', 'Beecool Heat Reflective Roofing Paint', '1L',  'ea', 20.00,  1),
  ('00000000-0000-0000-0006-000000000001', 'ARP-0005-005', 'Beecool Heat Reflective Roofing Paint', '5L',  'ea', 78.00,  2),
  ('00000000-0000-0000-0006-000000000001', 'ARP-0005-020', 'Beecool Heat Reflective Roofing Paint', '20L', 'ea', 293.00, 3);

-- Trust 3-in-1 Rust Converter / Primer
insert into pricelist_categories (id, name, note, sort_order) values
  ('00000000-0000-0000-0007-000000000001', 'Trust 3-in-1 Rust Converter / Primer', 'White only', 7)
on conflict (id) do update set name = excluded.name, note = excluded.note;

insert into pricelist_rows (category_id, part_no, description, size, unit, price_usd, sort_order) values
  ('00000000-0000-0000-0007-000000000001', 'RCPM-0001-450', 'Trust 3-in-1 Rust Converter / Primer', '450g', 'ea', 23.00,  1),
  ('00000000-0000-0000-0007-000000000001', 'RCPM-0001-001', 'Trust 3-in-1 Rust Converter / Primer', '900g', 'ea', 41.00,  2),
  ('00000000-0000-0000-0007-000000000001', 'RCPM-0001-005', 'Trust 3-in-1 Rust Converter / Primer', '5L',   'ea', 171.00, 3),
  ('00000000-0000-0000-0007-000000000001', 'RCPM-0001-020', 'Trust 3-in-1 Rust Converter / Primer', '20L',  'ea', 669.50, 4);

-- EasySeal
insert into pricelist_categories (id, name, sort_order) values
  ('00000000-0000-0000-0008-000000000001', 'EasySeal', 8)
on conflict (id) do update set name = excluded.name;

insert into pricelist_rows (category_id, part_no, description, price_usd, sort_order) values
  ('00000000-0000-0000-0008-000000000001', 'EASYSEAL FIBRE-IT', 'EasySeal Fibre-It', 10.00, 1);
