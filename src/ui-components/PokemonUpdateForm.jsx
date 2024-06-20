/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { getPokemon } from "../graphql/queries";
import { updatePokemon } from "../graphql/mutations";
const client = generateClient();
export default function PokemonUpdateForm(props) {
  const {
    id: idProp,
    pokemon: pokemonModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    name: "",
    index: "",
    pokedexNo: "",
    height: "",
  };
  const [name, setName] = React.useState(initialValues.name);
  const [index, setIndex] = React.useState(initialValues.index);
  const [pokedexNo, setPokedexNo] = React.useState(initialValues.pokedexNo);
  const [height, setHeight] = React.useState(initialValues.height);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = pokemonRecord
      ? { ...initialValues, ...pokemonRecord }
      : initialValues;
    setName(cleanValues.name);
    setIndex(cleanValues.index);
    setPokedexNo(cleanValues.pokedexNo);
    setHeight(cleanValues.height);
    setErrors({});
  };
  const [pokemonRecord, setPokemonRecord] = React.useState(pokemonModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await client.graphql({
              query: getPokemon.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getPokemon
        : pokemonModelProp;
      setPokemonRecord(record);
    };
    queryData();
  }, [idProp, pokemonModelProp]);
  React.useEffect(resetStateValues, [pokemonRecord]);
  const validations = {
    name: [{ type: "Required" }],
    index: [{ type: "Required" }],
    pokedexNo: [{ type: "Required" }],
    height: [{ type: "Required" }],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          name,
          index,
          pokedexNo,
          height,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await client.graphql({
            query: updatePokemon.replaceAll("__typename", ""),
            variables: {
              input: {
                id: pokemonRecord.id,
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "PokemonUpdateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={true}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              index,
              pokedexNo,
              height,
            };
            const result = onChange(modelFields);
            value = result?.name ?? value;
          }
          if (errors.name?.hasError) {
            runValidationTasks("name", value);
          }
          setName(value);
        }}
        onBlur={() => runValidationTasks("name", name)}
        errorMessage={errors.name?.errorMessage}
        hasError={errors.name?.hasError}
        {...getOverrideProps(overrides, "name")}
      ></TextField>
      <TextField
        label="Index"
        isRequired={true}
        isReadOnly={false}
        value={index}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              index: value,
              pokedexNo,
              height,
            };
            const result = onChange(modelFields);
            value = result?.index ?? value;
          }
          if (errors.index?.hasError) {
            runValidationTasks("index", value);
          }
          setIndex(value);
        }}
        onBlur={() => runValidationTasks("index", index)}
        errorMessage={errors.index?.errorMessage}
        hasError={errors.index?.hasError}
        {...getOverrideProps(overrides, "index")}
      ></TextField>
      <TextField
        label="Pokedex no"
        isRequired={true}
        isReadOnly={false}
        value={pokedexNo}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              index,
              pokedexNo: value,
              height,
            };
            const result = onChange(modelFields);
            value = result?.pokedexNo ?? value;
          }
          if (errors.pokedexNo?.hasError) {
            runValidationTasks("pokedexNo", value);
          }
          setPokedexNo(value);
        }}
        onBlur={() => runValidationTasks("pokedexNo", pokedexNo)}
        errorMessage={errors.pokedexNo?.errorMessage}
        hasError={errors.pokedexNo?.hasError}
        {...getOverrideProps(overrides, "pokedexNo")}
      ></TextField>
      <TextField
        label="Height"
        isRequired={true}
        isReadOnly={false}
        type="number"
        step="any"
        value={height}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              index,
              pokedexNo,
              height: value,
            };
            const result = onChange(modelFields);
            value = result?.height ?? value;
          }
          if (errors.height?.hasError) {
            runValidationTasks("height", value);
          }
          setHeight(value);
        }}
        onBlur={() => runValidationTasks("height", height)}
        errorMessage={errors.height?.errorMessage}
        hasError={errors.height?.hasError}
        {...getOverrideProps(overrides, "height")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || pokemonModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || pokemonModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
