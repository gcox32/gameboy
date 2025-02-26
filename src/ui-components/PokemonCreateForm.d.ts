/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type PokemonCreateFormInputValues = {
    name?: string;
    index?: string;
    pokedexNo?: string;
    height?: number;
};
export declare type PokemonCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    index?: ValidationFunction<string>;
    pokedexNo?: ValidationFunction<string>;
    height?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PokemonCreateFormOverridesProps = {
    PokemonCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    index?: PrimitiveOverrideProps<TextFieldProps>;
    pokedexNo?: PrimitiveOverrideProps<TextFieldProps>;
    height?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type PokemonCreateFormProps = React.PropsWithChildren<{
    overrides?: PokemonCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: PokemonCreateFormInputValues) => PokemonCreateFormInputValues;
    onSuccess?: (fields: PokemonCreateFormInputValues) => void;
    onError?: (fields: PokemonCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PokemonCreateFormInputValues) => PokemonCreateFormInputValues;
    onValidate?: PokemonCreateFormValidationValues;
} & React.CSSProperties>;
export default function PokemonCreateForm(props: PokemonCreateFormProps): React.ReactElement<any>;
