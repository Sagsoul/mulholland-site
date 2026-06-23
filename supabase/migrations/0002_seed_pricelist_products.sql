-- Migration: 0002_seed_pricelist_products.sql
-- Seeds every Jan-26 retail price-list row as a buyable product.
-- Idempotent: re-running updates name/description/price/category only;
-- does NOT reset stock_qty, is_active, or image_url.

insert into products (sku, name, description, category_id, price_usd, stock_qty, is_second_hand, is_active)
values
  -- FIBERFIX → pipe-repair
  ('AFPFF5015',
   'AFP FibreFix Fibreglass & Resin Bandage 50mm × 1.5m',
   'High-quality fibreglass and resin bandage for pipe repair, 50mm × 1.5 metres.',
   (select id from categories where slug = 'pipe-repair'),
   23.50, 0, false, true),

  ('AFPFF10015',
   'AFP FibreFix Fibreglass & Resin Bandage 100mm × 1.5m',
   'High-quality fibreglass and resin bandage for pipe repair, 100mm × 1.5 metres.',
   (select id from categories where slug = 'pipe-repair'),
   37.50, 0, false, true),

  ('AFPFF10025',
   'AFP FibreFix Fibreglass & Resin Bandage 100mm × 2.5m',
   'High-quality fibreglass and resin bandage for pipe repair, 100mm × 2.5 metres.',
   (select id from categories where slug = 'pipe-repair'),
   43.50, 0, false, true),

  ('AFPFF10036',
   'AFP FibreFix Fibreglass & Resin Bandage 100mm × 3.6m',
   'High-quality fibreglass and resin bandage for pipe repair, 100mm × 3.6 metres.',
   (select id from categories where slug = 'pipe-repair'),
   68.50, 0, false, true),

  ('AFPFF10048',
   'AFP FibreFix Fibreglass & Resin Bandage 100mm × 4.8m',
   'High-quality fibreglass and resin bandage for pipe repair, 100mm × 4.8 metres.',
   (select id from categories where slug = 'pipe-repair'),
   80.00, 0, false, true),

  ('AFPFF10065',
   'AFP FibreFix Fibreglass & Resin Bandage 100mm × 6.5m',
   'High-quality fibreglass and resin bandage for pipe repair, 100mm × 6.5 metres.',
   (select id from categories where slug = 'pipe-repair'),
   94.50, 0, false, true),

  ('AFPFF100150',
   'AFP FibreFix Fibreglass & Resin Bandage 100mm × 15.2m',
   'High-quality fibreglass and resin bandage for pipe repair, 100mm × 15.2 metres.',
   (select id from categories where slug = 'pipe-repair'),
   200.50, 0, false, true),

  -- FIBASTRIP → pipe-repair
  ('FIBA-RP-30X3',
   'FibaStrip Butyl Tape with Cloth Membrane (Retail Pack) 30mm × 3m',
   'Butyl tape with cloth membrane for pipe sealing, retail packaging 30mm × 3 metres.',
   (select id from categories where slug = 'pipe-repair'),
   25.00, 0, false, true),

  ('FIBA-CR-30X15',
   'FibaStrip Butyl Tape with Cloth Membrane (Commercial Roll) 30mm × 15m',
   'Butyl tape with cloth membrane for pipe sealing, commercial roll 30mm × 15 metres.',
   (select id from categories where slug = 'pipe-repair'),
   35.00, 0, false, true),

  ('FIBA-CR-50X15',
   'FibaStrip Butyl Tape with Cloth Membrane (Commercial Roll) 50mm × 15m',
   'Butyl tape with cloth membrane for pipe sealing, commercial roll 50mm × 15 metres.',
   (select id from categories where slug = 'pipe-repair'),
   49.50, 0, false, true),

  ('FIBA-CR-70X15',
   'FibaStrip Butyl Tape with Cloth Membrane (Commercial Roll) 70mm × 15m',
   'Butyl tape with cloth membrane for pipe sealing, commercial roll 70mm × 15 metres.',
   (select id from categories where slug = 'pipe-repair'),
   67.00, 0, false, true),

  -- Rubberguard Normal (Black) → paint
  ('RGN-0002-001',
   'Rubberguard Normal 1L Black',
   'Rubberguard Normal waterproofing coating, 1 litre, Black.',
   (select id from categories where slug = 'paint'),
   15.00, 0, false, true),

  ('RGN-0002-002.5',
   'Rubberguard Normal 2.5L Black',
   'Rubberguard Normal waterproofing coating, 2.5 litres, Black.',
   (select id from categories where slug = 'paint'),
   33.50, 0, false, true),

  ('RGN-0002-005',
   'Rubberguard Normal 5L Black',
   'Rubberguard Normal waterproofing coating, 5 litres, Black.',
   (select id from categories where slug = 'paint'),
   64.00, 0, false, true),

  ('RGN-0002-020',
   'Rubberguard Normal 20L Black',
   'Rubberguard Normal waterproofing coating, 20 litres, Black.',
   (select id from categories where slug = 'paint'),
   242.50, 0, false, true),

  -- Rubberguard Fine (Brush/Spray – Black) → paint
  ('RGF-0001-001',
   'Rubberguard Fine 1L Stonechip Spray Gun Bottle Black',
   'Rubberguard Fine stonechip spray gun bottle, 1 litre, Black.',
   (select id from categories where slug = 'paint'),
   20.00, 0, false, true),

  ('RGF-0002-005',
   'Rubberguard Fine Brush/Spray 5L Black',
   'Rubberguard Fine brush or spray application, 5 litres, Black.',
   (select id from categories where slug = 'paint'),
   82.50, 0, false, true),

  ('RGF-0002-020',
   'Rubberguard Fine Brush/Spray 20L Black',
   'Rubberguard Fine brush or spray application, 20 litres, Black.',
   (select id from categories where slug = 'paint'),
   299.00, 0, false, true),

  -- Rubberguard Smooth → paint
  ('RGS-0002-005',
   'Rubberguard Smooth 5L',
   'Rubberguard Smooth waterproofing membrane, 5 litres.',
   (select id from categories where slug = 'paint'),
   74.50, 0, false, true),

  ('RGS-0002-020',
   'Rubberguard Smooth 20L',
   'Rubberguard Smooth waterproofing membrane, 20 litres.',
   (select id from categories where slug = 'paint'),
   277.50, 0, false, true),

  -- Beecool Heat Reflective Roofing Paint → paint
  ('ARP-0005-001',
   'Beecool Heat Reflective Roofing Paint 1L',
   'Beecool heat reflective roofing paint, 1 litre.',
   (select id from categories where slug = 'paint'),
   20.00, 0, false, true),

  ('ARP-0005-005',
   'Beecool Heat Reflective Roofing Paint 5L',
   'Beecool heat reflective roofing paint, 5 litres.',
   (select id from categories where slug = 'paint'),
   78.00, 0, false, true),

  ('ARP-0005-020',
   'Beecool Heat Reflective Roofing Paint 20L',
   'Beecool heat reflective roofing paint, 20 litres.',
   (select id from categories where slug = 'paint'),
   293.00, 0, false, true),

  -- Trust 3-in-1 Rust Converter / Primer → rust-converter
  ('RCPM-0001-450',
   'Trust 3-in-1 Rust Converter / Primer 450g',
   'Trust 3-in-1 rust converter, primer and paint in one, 450 grams.',
   (select id from categories where slug = 'rust-converter'),
   23.00, 0, false, true),

  ('RCPM-0001-001',
   'Trust 3-in-1 Rust Converter / Primer 900g',
   'Trust 3-in-1 rust converter, primer and paint in one, 900 grams.',
   (select id from categories where slug = 'rust-converter'),
   41.00, 0, false, true),

  ('RCPM-0001-005',
   'Trust 3-in-1 Rust Converter / Primer 5L',
   'Trust 3-in-1 rust converter, primer and paint in one, 5 litres.',
   (select id from categories where slug = 'rust-converter'),
   171.00, 0, false, true),

  ('RCPM-0001-020',
   'Trust 3-in-1 Rust Converter / Primer 20L',
   'Trust 3-in-1 rust converter, primer and paint in one, 20 litres.',
   (select id from categories where slug = 'rust-converter'),
   669.50, 0, false, true),

  -- EasySeal → roof-repair
  ('EASYSEAL-FIBRE-IT',
   'EasySeal Fibre-It',
   'EasySeal Fibre-It liquid waterproofing accessory.',
   (select id from categories where slug = 'roof-repair'),
   10.00, 0, false, true)

on conflict (sku) do update set
  name        = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  price_usd   = excluded.price_usd,
  updated_at  = now();
