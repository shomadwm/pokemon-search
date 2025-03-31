import React from "react";

// アロー関数でコンポーネントを定義
const PokemonThumbnails = ({ id, name, image, type }) => {

    return (
      <div className="thumb-container grass">
        <div className="number">
          <small>#0{id}</small>
        </div>
        <img src={image} alt={name} />
        <div className="detail-wrapper">
          <h4>{name}</h4>
          <h3>{type}</h3>
        </div>
      </div>
    );
  };
  


