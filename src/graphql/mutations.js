/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createGame = /* GraphQL */ `
  mutation CreateGame(
    $input: CreateGameInput!
    $condition: ModelGameConditionInput
  ) {
    createGame(input: $input, condition: $condition) {
      id
      title
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateGame = /* GraphQL */ `
  mutation UpdateGame(
    $input: UpdateGameInput!
    $condition: ModelGameConditionInput
  ) {
    updateGame(input: $input, condition: $condition) {
      id
      title
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteGame = /* GraphQL */ `
  mutation DeleteGame(
    $input: DeleteGameInput!
    $condition: ModelGameConditionInput
  ) {
    deleteGame(input: $input, condition: $condition) {
      id
      title
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createSaveState = /* GraphQL */ `
  mutation CreateSaveState(
    $input: CreateSaveStateInput!
    $condition: ModelSaveStateConditionInput
  ) {
    createSaveState(input: $input, condition: $condition) {
      id
      game {
        id
        title
        description
        img
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
      owner
      __typename
    }
  }
`;
export const updateSaveState = /* GraphQL */ `
  mutation UpdateSaveState(
    $input: UpdateSaveStateInput!
    $condition: ModelSaveStateConditionInput
  ) {
    updateSaveState(input: $input, condition: $condition) {
      id
      game {
        id
        title
        description
        img
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
      owner
      __typename
    }
  }
`;
export const deleteSaveState = /* GraphQL */ `
  mutation DeleteSaveState(
    $input: DeleteSaveStateInput!
    $condition: ModelSaveStateConditionInput
  ) {
    deleteSaveState(input: $input, condition: $condition) {
      id
      game {
        id
        title
        description
        img
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
      owner
      __typename
    }
  }
`;
export const createPokemon = /* GraphQL */ `
  mutation CreatePokemon(
    $input: CreatePokemonInput!
    $condition: ModelPokemonConditionInput
  ) {
    createPokemon(input: $input, condition: $condition) {
      id
      name
      index
      pokedexNo
      height
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updatePokemon = /* GraphQL */ `
  mutation UpdatePokemon(
    $input: UpdatePokemonInput!
    $condition: ModelPokemonConditionInput
  ) {
    updatePokemon(input: $input, condition: $condition) {
      id
      name
      index
      pokedexNo
      height
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deletePokemon = /* GraphQL */ `
  mutation DeletePokemon(
    $input: DeletePokemonInput!
    $condition: ModelPokemonConditionInput
  ) {
    deletePokemon(input: $input, condition: $condition) {
      id
      name
      index
      pokedexNo
      height
      createdAt
      updatedAt
      __typename
    }
  }
`;
