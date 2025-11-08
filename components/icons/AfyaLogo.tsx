import React from 'react';

// Alterado de um componente SVG para um componente React geral que renderiza uma <img>
const AfyaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="https://companieslogo.com/img/orig/AFYA_BIG-54d3e65a.png?t=1742570503"
    alt="Afya Logo Oficial"
    className={className}
    // Esta combinação de filtros CSS irá pegar a imagem de origem, torná-la em tons de cinza,
    // em seguida, inverter as cores para branco.
    // É uma maneira confiável de tornar um logotipo colorido branco.
    style={{ filter: 'grayscale(1) brightness(0) invert(1)' }}
  />
);

export default AfyaLogo;
