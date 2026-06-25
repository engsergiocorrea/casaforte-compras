insert into public.categorias_materiais (nome, descricao)
values
('Cimento', 'Cimentos e argamassas estruturais'),
('Areia', 'Areias para obra'),
('Brita', 'Agregados graúdos'),
('Aço', 'Vergalhões, telas, arames e ferragens'),
('Madeira', 'Madeiras para estrutura, forma e acabamento'),
('Hidráulica', 'Tubos, conexões, registros e acessórios hidráulicos'),
('Elétrica', 'Fios, cabos, quadros, disjuntores e acessórios elétricos'),
('Pintura', 'Tintas, massas, seladores e acessórios'),
('Revestimentos', 'Porcelanatos, cerâmicas, pedras e revestimentos'),
('Ferramentas', 'Ferramentas manuais e elétricas'),
('Locação de equipamentos', 'Equipamentos locados para obra'),
('Esquadrias', 'Portas, janelas, alumínio, vidro e acessórios'),
('Gesso', 'Forro, drywall, placas e acessórios'),
('Impermeabilização', 'Mantas, emulsões, aditivos e sistemas de impermeabilização'),
('Piscina', 'Materiais e equipamentos para piscina'),
('Paisagismo', 'Grama, plantas, insumos e jardinagem'),
('Cobertura', 'Itens gerais de cobertura'),
('Telhado', 'Telhas, madeiramento e acessórios de telhado'),
('Concreto', 'Concreto usinado e insumos relacionados'),
('Outros', 'Materiais diversos')
on conflict (nome) do nothing;
