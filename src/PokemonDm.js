import { LitElement} from 'lit-element';



export class PokemonDm extends LitElement {
  constructor() {
    super();
    // Inicializamos 'pokemones' como un array vacío
    this.pokemones = [];
    this.offset = 0;      // Inicializamos el offset
    this.limit = 20;      // Inicializamos el limit
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchPokemones();  // Llamamos a fetchPokemones cuando el componente se conecta
  }

  async fetchPokemones() {
    try {
      const promesas = [];
      for (let i = this.offset + 1; i <= this.offset + this.limit; i++) {
        promesas.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json()));
      }
      const datosPokemones = await Promise.all(promesas);

      const filteredPokemones = await Promise.all(
        datosPokemones.map(pokemon => this.fetchDatosBasicos(pokemon))
      );

      const newPokemones = filteredPokemones.filter(pokemon => !pokemon.hasEvolutions);

      // Verificamos si 'this.pokemones' es un array antes de intentar expandirlo
      if (!Array.isArray(this.pokemones)) {
        this.pokemones = [];
      }

      // Expandimos los nuevos pokemones en el array existente
      this.pokemones = [...this.pokemones, ...newPokemones]; 

      // Despachamos el evento con los datos cargados
      this.dispatchEvent(new CustomEvent('pokemones-cargados', {
        detail: { pokemones: this.pokemones },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error("Error fetching pokemones:", error);
    }
  }

  // Método fetchDatosBasicos sigue igual...
  async fetchDatosBasicos(pokemon) {
    const speciesResponse = await fetch(pokemon.species.url);
    const speciesData = await speciesResponse.json();
    const hasEvolutions = speciesData.evolves_from_species !== null;

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
}

