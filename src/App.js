import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [pokemonTypes, setPokemonTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [pokemonDetails, setPokemonDetails] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      const response = await axios.get('https://pokeapi.co/api/v2/type');
  
      const typeTranslations = {
        "normal": "ノーマル",
        "fire": "ほのお",
        "water": "みず",
        "electric": "でんき",
        "grass": "くさ",
        "ice": "こおり",
        "fighting": "かくとう",
        "poison": "どく",
        "ground": "じめん",
        "flying": "ひこう",
        "psychic": "エスパー",
        "bug": "むし",
        "rock": "いわ",
        "ghost": "ゴースト",
        "dragon": "ドラゴン",
        "dark": "あく",
        "steel": "はがね",
        "fairy": "フェアリー"
      };
  
      const translatedTypes = response.data.results
        .filter(type => typeTranslations[type.name]) // 不要なデータを除外
        .map(type => ({
          name: typeTranslations[type.name], 
          url: type.url
        }));
  
      setPokemonTypes(translatedTypes);
    };
    fetchTypes();
  }, []);
  

  useEffect(() => {
    const fetchPokemonList = async () => {
      if (selectedType) {
        setLoading(true);
        const response = await axios.get(selectedType);
        setPokemonList(response.data.pokemon);
        setLoading(false);
      } else {
        setPokemonList([]);
      }
    };
    fetchPokemonList();
  }, [selectedType]);

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      if (pokemonList.length === 0) return;
      setLoading(true);
      const detailsPromises = pokemonList.map(p => axios.get(p.pokemon.url));
      const detailsResponses = await Promise.all(detailsPromises);
      const detailedPokemon = detailsResponses.map(res => res.data);

      const translatedPokemon = await Promise.all(detailedPokemon.map(async (pokemon) => {
        const speciesResponse = await axios.get(pokemon.species.url);
        const jpName = speciesResponse.data.names.find(name => name.language.name === 'ja');
        return { ...pokemon, japaneseName: jpName ? jpName.name : pokemon.name };
      }));

      setPokemonDetails(translatedPokemon);
      setLoading(false);
    };
    fetchPokemonDetails();
  }, [pokemonList]);

  const handleSearch = async () => {
    setLoading(true);
    let filteredPokemon = [...pokemonList];

    if (searchId) {
      const searchIdNum = parseInt(searchId);
      if (filter === '以前') {
        filteredPokemon = filteredPokemon.filter(p => {
          const id = parseInt(p.pokemon.url.split('/').slice(-2, -1)[0]);
          return id <= searchIdNum;
        });
      } else if (filter === '以降') {
        filteredPokemon = filteredPokemon.filter(p => {
          const id = parseInt(p.pokemon.url.split('/').slice(-2, -1)[0]);
          return id >= searchIdNum;
        });
      } else {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${searchIdNum}`);
        const speciesResponse = await axios.get(response.data.species.url);
        const jpName = speciesResponse.data.names.find(name => name.language.name === 'ja');
        setPokemonDetails([{ ...response.data, japaneseName: jpName ? jpName.name : response.data.name }]);
        setLoading(false);
        return;
      }
    }

    const detailsPromises = filteredPokemon.map(p => axios.get(p.pokemon.url));
    const detailsResponses = await Promise.all(detailsPromises);
    const detailedPokemon = detailsResponses.map(res => res.data);

    const translatedPokemon = await Promise.all(detailedPokemon.map(async (pokemon) => {
      const speciesResponse = await axios.get(pokemon.species.url);
      const jpName = speciesResponse.data.names.find(name => name.language.name === 'ja');
      return { ...pokemon, japaneseName: jpName ? jpName.name : pokemon.name };
    }));

    setPokemonDetails(translatedPokemon);
    setLoading(false);
  };

  const handleReset = () => {
    setSelectedType('');
    setSearchId('');
    setFilter('');
    setPokemonList([]);
    setPokemonDetails([]);
  };

  const handlePokemonClick = async (pokemon) => {
    setSelectedPokemon(null);
    setEvolutionChain([]);
    setIsModalOpen(true);
  
    const speciesResponse = await axios.get(pokemon.species.url);
    const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
    const evolutionResponse = await axios.get(evolutionChainUrl);
    const chain = await extractEvolutionChain(evolutionResponse.data.chain);
  
    setSelectedPokemon(pokemon);
    setEvolutionChain(chain);
  };
  
  const extractEvolutionChain = async (chain) => {
    let evolutionData = [];
    let current = chain;
  
    while (current) {
      const speciesResponse = await axios.get(current.species.url);
      const jpName = speciesResponse.data.names.find(name => name.language.name === 'ja');
  
      evolutionData.push({
        name: jpName ? jpName.name : current.species.name, // 日本語名を取得
        url: current.species.url.replace('pokemon-species', 'pokemon')
      });
  
      current = current.evolves_to[0] || null;
    }
  
    return evolutionData;
  };
  

  return (
    <div className="App">
      <h1>ポケモン図鑑</h1>
      <select onChange={e => setSelectedType(e.target.value)}>
        <option value="">タイプを選択</option>
        {pokemonTypes.map(type => (
          <option key={type.url} value={type.url}>{type.name}</option>
        ))}
      </select>

      <div>
        <input
          type="number"
          placeholder="IDで検索"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
        />
        <button onClick={handleSearch}>検索</button>
        <select onChange={e => setFilter(e.target.value)}>
          <option value="">選択してください</option>
          <option value="以前">以前</option>
          <option value="以降">以降</option>
        </select>
        <button onClick={handleReset}>リセット</button>
      </div>
      <div className="pokemon-container">
        {loading ? <p>読み込み中...</p> : (
          pokemonDetails.map(pokemon => (
            <div key={pokemon.id} className="pokemon" onClick={() => handlePokemonClick(pokemon)}>
              <img src={pokemon.sprites.front_default} alt={pokemon.name} />
              <p>{pokemon.japaneseName} (ID: {pokemon.id})</p>
            </div>
          ))
        )}
      </div>
      {isModalOpen && <Modal pokemon={selectedPokemon} evolutions={evolutionChain} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

const Modal = ({ pokemon, evolutions, onClose }) => {
  if (!pokemon) return null;

  const statTranslations = {
    "hp": "HP",
    "attack": "こうげき",
    "defense": "ぼうぎょ",
    "special-attack": "とくこう",
    "special-defense": "とくぼう",
    "speed": "すばやさ"
  };

  const typeTranslations = {
    "normal": "ノーマル",
    "fire": "ほのお",
    "water": "みず",
    "electric": "でんき",
    "grass": "くさ",
    "ice": "こおり",
    "fighting": "かくとう",
    "poison": "どく",
    "ground": "じめん",
    "flying": "ひこう",
    "psychic": "エスパー",
    "bug": "むし",
    "rock": "いわ",
    "ghost": "ゴースト",
    "dragon": "ドラゴン",
    "dark": "あく",
    "steel": "はがね",
    "fairy": "フェアリー"
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{pokemon.japaneseName} (ID: {pokemon.id})</h2>
        <img src={pokemon.sprites.front_default} alt={pokemon.name} />

        <h3>タイプ</h3>
        <p>
          {pokemon.types.map(t => typeTranslations[t.type.name] || t.type.name).join(', ')}
        </p>

        <h3>種族値</h3>
        <ul>
          {pokemon.stats.map(stat => (
            <li key={stat.stat.name}>
              {statTranslations[stat.stat.name] || stat.stat.name}: {stat.base_stat}
            </li>
          ))}
        </ul>

        <h3>進化チェーン</h3>
        <div className="evolution-chain">
          {evolutions.map((evo, index) => (
            <span key={evo.name}>
              {index > 0 && " → "}
              {evo.name}
            </span>
           ))}
        </div>


        <button onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
};


export default App;
