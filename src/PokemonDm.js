import { LitElement} from 'lit-element';



export class PokemonDm extends LitElement {
  constructor() {
    super();
    this.pokemones = [];  // Inicializar como un array vacío
    this.offset = 0;      // Asegurar que offset y limit tengan valores por defecto
    this.limit = 20;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchPokemones();  // Cargamos los Pokémon al conectar
  }

  async fetchPokemones() {
    const promesas = [];
    for (let i = this.offset + 1; i <= this.offset + this.limit; i++) {
      promesas.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json()));
    }
    const datosPokemones = await Promise.all(promesas);

    const filteredPokemones = await Promise.all(
      datosPokemones.map(pokemon => this.fetchDatosBasicos(pokemon))
    );

    const newPokemones = filteredPokemones.filter(pokemon => !pokemon.hasEvolutions);
    this.pokemones = [...this.pokemones, ...newPokemones]; 

    // Despachamos el evento después de cargar los Pokémon
    this.dispatchEvent(new CustomEvent('pokemones-cargados', {
      detail: { pokemones: this.pokemones },
      bubbles: true,
      composed: true
    }));
  }

  async fetchDatosBasicos(pokemon) {
    const speciesResponse = await fetch(pokemon.species.url);
    const speciesData = await speciesResponse.json();
    const hasEvolutions = speciesData.evolves_from_species !== null;

    // Obtener la cadena de evoluciones
    const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
    const evolutionChainData = await evolutionChainResponse.json();

    const evolutions = await this.getEvolutionsWithDetails(evolutionChainData.chain);

    return {
      nombre: pokemon.name,
      imagenUrl: pokemon.sprites.front_default,
      speciesUrl: pokemon.species.url,
      types: pokemon.types.map(typeInfo => typeInfo.type.name).join(', '),
      hasEvolutions: hasEvolutions,
      evolutions: evolutions,
    };
  }

  async fetchEvolutions() {
    try {
      const speciesResponse = await fetch(this.selectedSpeciesUrl);
      const speciesData = await speciesResponse.json();

      const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionChainData = await evolutionChainResponse.json();

      const evolutions = await this.getEvolutionsWithDetails(evolutionChainData.chain);
      this.selectedPokemonEvolutions = evolutions;
      this.showModal = true;
    } catch (error) {
      console.error("Error fetching evolution data:", error);
    }
  }

  async getEvolutionsWithDetails(chain) {
    const evolutions = [];
    let current = chain;
    while (current) {
      const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${current.species.name}`).then(res => res.json());
      evolutions.push({
        name: pokemonData.name,
        imageUrl: pokemonData.sprites.front_default,
        types: pokemonData.types.map(typeInfo => typeInfo.type.name).join(', ')
      });
      current = current.evolves_to[0];
    }
    return evolutions;
  }

  closeModal() {
    this.showModal = false;
    this.selectedPokemonEvolutions = [];
  }

  handleDetalles(pokemon) {
    this.selectedSpeciesUrl = pokemon.speciesUrl; // Guardar speciesUrl para cargar evoluciones
    this.fetchEvolutions(); // Llamar a fetchEvolutions al abrir modal
  }

  async loadMore() {
    this.offset += this.limit;
    await this.fetchPokemones();
  }
  
}
