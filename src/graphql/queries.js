/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSaveFile = /* GraphQL */ `
  query GetSaveFile($id: ID!) {
    getSaveFile(id: $id) {
      id
      userId
      game {
        id
        title
        description
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listSaveFiles = /* GraphQL */ `
  query ListSaveFiles(
    $filter: ModelSaveFileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSaveFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        game {
          id
          title
          description
          filePath
          createdAt
          updatedAt
          __typename
        }
        data
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
      id
      title
      description
      filePath
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
        description
        filePath
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
