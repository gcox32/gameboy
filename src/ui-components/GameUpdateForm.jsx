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
import { getGame } from "../graphql/queries";
import { updateGame } from "../graphql/mutations";
const client = generateClient();
export default function GameUpdateForm(props) {
  const {
    id: idProp,
    game: gameModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    owner: "",
    title: "",
    releaseDate: "",
    description: "",
    img: "",
    filePath: "",
    backgroundImg: "",
    series: "",
    generation: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [title, setTitle] = React.useState(initialValues.title);
  const [releaseDate, setReleaseDate] = React.useState(
    initialValues.releaseDate
  );
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [img, setImg] = React.useState(initialValues.img);
  const [filePath, setFilePath] = React.useState(initialValues.filePath);
  const [backgroundImg, setBackgroundImg] = React.useState(
    initialValues.backgroundImg
  );
  const [series, setSeries] = React.useState(initialValues.series);
  const [generation, setGeneration] = React.useState(initialValues.generation);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = gameRecord
      ? { ...initialValues, ...gameRecord }
      : initialValues;
    setOwner(cleanValues.owner);
    setTitle(cleanValues.title);
    setReleaseDate(cleanValues.releaseDate);
    setDescription(cleanValues.description);
    setImg(cleanValues.img);
    setFilePath(cleanValues.filePath);
    setBackgroundImg(cleanValues.backgroundImg);
    setSeries(cleanValues.series);
    setGeneration(cleanValues.generation);
    setErrors({});
  };
  const [gameRecord, setGameRecord] = React.useState(gameModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await client.graphql({
              query: getGame.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getGame
        : gameModelProp;
      setGameRecord(record);
    };
    queryData();
  }, [idProp, gameModelProp]);
  React.useEffect(resetStateValues, [gameRecord]);
  const validations = {
    owner: [{ type: "Required" }],
    title: [{ type: "Required" }],
    releaseDate: [],
    description: [],
    img: [],
    filePath: [],
    backgroundImg: [],
    series: [],
    generation: [],
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
          owner,
          title,
          releaseDate: releaseDate ?? null,
          description: description ?? null,
          img: img ?? null,
          filePath: filePath ?? null,
          backgroundImg: backgroundImg ?? null,
          series: series ?? null,
          generation: generation ?? null,
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
            query: updateGame.replaceAll("__typename", ""),
            variables: {
              input: {
                id: gameRecord.id,
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
      {...getOverrideProps(overrides, "GameUpdateForm")}
      {...rest}
    >
      <TextField
        label="Owner"
        isRequired={true}
        isReadOnly={false}
        value={owner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner: value,
              title,
              releaseDate,
              description,
              img,
              filePath,
              backgroundImg,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.owner ?? value;
          }
          if (errors.owner?.hasError) {
            runValidationTasks("owner", value);
          }
          setOwner(value);
        }}
        onBlur={() => runValidationTasks("owner", owner)}
        errorMessage={errors.owner?.errorMessage}
        hasError={errors.owner?.hasError}
        {...getOverrideProps(overrides, "owner")}
      ></TextField>
      <TextField
        label="Title"
        isRequired={true}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title: value,
              releaseDate,
              description,
              img,
              filePath,
              backgroundImg,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.title ?? value;
          }
          if (errors.title?.hasError) {
            runValidationTasks("title", value);
          }
          setTitle(value);
        }}
        onBlur={() => runValidationTasks("title", title)}
        errorMessage={errors.title?.errorMessage}
        hasError={errors.title?.hasError}
        {...getOverrideProps(overrides, "title")}
      ></TextField>
      <TextField
        label="Release date"
        isRequired={false}
        isReadOnly={false}
        value={releaseDate}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate: value,
              description,
              img,
              filePath,
              backgroundImg,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.releaseDate ?? value;
          }
          if (errors.releaseDate?.hasError) {
            runValidationTasks("releaseDate", value);
          }
          setReleaseDate(value);
        }}
        onBlur={() => runValidationTasks("releaseDate", releaseDate)}
        errorMessage={errors.releaseDate?.errorMessage}
        hasError={errors.releaseDate?.hasError}
        {...getOverrideProps(overrides, "releaseDate")}
      ></TextField>
      <TextField
        label="Description"
        isRequired={false}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate,
              description: value,
              img,
              filePath,
              backgroundImg,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.description ?? value;
          }
          if (errors.description?.hasError) {
            runValidationTasks("description", value);
          }
          setDescription(value);
        }}
        onBlur={() => runValidationTasks("description", description)}
        errorMessage={errors.description?.errorMessage}
        hasError={errors.description?.hasError}
        {...getOverrideProps(overrides, "description")}
      ></TextField>
      <TextField
        label="Img"
        isRequired={false}
        isReadOnly={false}
        value={img}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate,
              description,
              img: value,
              filePath,
              backgroundImg,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.img ?? value;
          }
          if (errors.img?.hasError) {
            runValidationTasks("img", value);
          }
          setImg(value);
        }}
        onBlur={() => runValidationTasks("img", img)}
        errorMessage={errors.img?.errorMessage}
        hasError={errors.img?.hasError}
        {...getOverrideProps(overrides, "img")}
      ></TextField>
      <TextField
        label="File path"
        isRequired={false}
        isReadOnly={false}
        value={filePath}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate,
              description,
              img,
              filePath: value,
              backgroundImg,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.filePath ?? value;
          }
          if (errors.filePath?.hasError) {
            runValidationTasks("filePath", value);
          }
          setFilePath(value);
        }}
        onBlur={() => runValidationTasks("filePath", filePath)}
        errorMessage={errors.filePath?.errorMessage}
        hasError={errors.filePath?.hasError}
        {...getOverrideProps(overrides, "filePath")}
      ></TextField>
      <TextField
        label="Background img"
        isRequired={false}
        isReadOnly={false}
        value={backgroundImg}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate,
              description,
              img,
              filePath,
              backgroundImg: value,
              series,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.backgroundImg ?? value;
          }
          if (errors.backgroundImg?.hasError) {
            runValidationTasks("backgroundImg", value);
          }
          setBackgroundImg(value);
        }}
        onBlur={() => runValidationTasks("backgroundImg", backgroundImg)}
        errorMessage={errors.backgroundImg?.errorMessage}
        hasError={errors.backgroundImg?.hasError}
        {...getOverrideProps(overrides, "backgroundImg")}
      ></TextField>
      <TextField
        label="Series"
        isRequired={false}
        isReadOnly={false}
        value={series}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate,
              description,
              img,
              filePath,
              backgroundImg,
              series: value,
              generation,
            };
            const result = onChange(modelFields);
            value = result?.series ?? value;
          }
          if (errors.series?.hasError) {
            runValidationTasks("series", value);
          }
          setSeries(value);
        }}
        onBlur={() => runValidationTasks("series", series)}
        errorMessage={errors.series?.errorMessage}
        hasError={errors.series?.hasError}
        {...getOverrideProps(overrides, "series")}
      ></TextField>
      <TextField
        label="Generation"
        isRequired={false}
        isReadOnly={false}
        value={generation}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              title,
              releaseDate,
              description,
              img,
              filePath,
              backgroundImg,
              series,
              generation: value,
            };
            const result = onChange(modelFields);
            value = result?.generation ?? value;
          }
          if (errors.generation?.hasError) {
            runValidationTasks("generation", value);
          }
          setGeneration(value);
        }}
        onBlur={() => runValidationTasks("generation", generation)}
        errorMessage={errors.generation?.errorMessage}
        hasError={errors.generation?.hasError}
        {...getOverrideProps(overrides, "generation")}
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
          isDisabled={!(idProp || gameModelProp)}
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
              !(idProp || gameModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
