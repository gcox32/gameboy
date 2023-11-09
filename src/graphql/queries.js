/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
      id
      title
      releaseDate
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      backgroundImg
      series
      generation
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listGames = /* GraphQL */ `
  query ListGames(
    $filter: ModelGameFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        releaseDate
        description
        img
        filePath
        backgroundImg
        series
        generation
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSaveState = /* GraphQL */ `
  query GetSaveState($id: ID!) {
    getSaveState(id: $id) {
      id
      owner
      game {
        id
        title
        releaseDate
        description
        img
        filePath
        backgroundImg
        series
        generation
        createdAt
        updatedAt
        __typename
      }
      filePath
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
      __typename
    }
  }
`;
export const listSaveStates = /* GraphQL */ `
  query ListSaveStates(
    $filter: ModelSaveStateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSaveStates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        filePath
        title
        description
        img
        createdAt
        updatedAt
        gameSaveStatesId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPokemon = /* GraphQL */ `
  query GetPokemon($id: ID!) {
    getPokemon(id: $id) {
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
export const listPokemon = /* GraphQL */ `
  query ListPokemon(
    $filter: ModelPokemonFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPokemon(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        index
        pokedexNo
        height
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
