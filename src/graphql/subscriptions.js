/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateGame = /* GraphQL */ `
  subscription OnCreateGame($filter: ModelSubscriptionGameFilterInput) {
    onCreateGame(filter: $filter) {
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
export const onUpdateGame = /* GraphQL */ `
  subscription OnUpdateGame($filter: ModelSubscriptionGameFilterInput) {
    onUpdateGame(filter: $filter) {
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
export const onDeleteGame = /* GraphQL */ `
  subscription OnDeleteGame($filter: ModelSubscriptionGameFilterInput) {
    onDeleteGame(filter: $filter) {
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
export const onCreateSaveState = /* GraphQL */ `
  subscription OnCreateSaveState(
    $filter: ModelSubscriptionSaveStateFilterInput
  ) {
    onCreateSaveState(filter: $filter) {
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
export const onUpdateSaveState = /* GraphQL */ `
  subscription OnUpdateSaveState(
    $filter: ModelSubscriptionSaveStateFilterInput
  ) {
    onUpdateSaveState(filter: $filter) {
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
export const onDeleteSaveState = /* GraphQL */ `
  subscription OnDeleteSaveState(
    $filter: ModelSubscriptionSaveStateFilterInput
  ) {
    onDeleteSaveState(filter: $filter) {
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
export const onCreatePokemon = /* GraphQL */ `
  subscription OnCreatePokemon($filter: ModelSubscriptionPokemonFilterInput) {
    onCreatePokemon(filter: $filter) {
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
export const onUpdatePokemon = /* GraphQL */ `
  subscription OnUpdatePokemon($filter: ModelSubscriptionPokemonFilterInput) {
    onUpdatePokemon(filter: $filter) {
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
export const onDeletePokemon = /* GraphQL */ `
  subscription OnDeletePokemon($filter: ModelSubscriptionPokemonFilterInput) {
    onDeletePokemon(filter: $filter) {
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
