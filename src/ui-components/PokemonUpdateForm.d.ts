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
export declare type PokemonUpdateFormInputValues = {
    name?: string;
    index?: string;
    pokedexNo?: string;
    height?: number;
};
export declare type PokemonUpdateFormValidationValues = {
    name?: ValidationFunction<string>;
    index?: ValidationFunction<string>;
    pokedexNo?: ValidationFunction<string>;
    height?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PokemonUpdateFormOverridesProps = {
    PokemonUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    index?: PrimitiveOverrideProps<TextFieldProps>;
    pokedexNo?: PrimitiveOverrideProps<TextFieldProps>;
    height?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type PokemonUpdateFormProps = React.PropsWithChildren<{
    overrides?: PokemonUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    pokemon?: any;
    onSubmit?: (fields: PokemonUpdateFormInputValues) => PokemonUpdateFormInputValues;
    onSuccess?: (fields: PokemonUpdateFormInputValues) => void;
    onError?: (fields: PokemonUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PokemonUpdateFormInputValues) => PokemonUpdateFormInputValues;
    onValidate?: PokemonUpdateFormValidationValues;
} & React.CSSProperties>;
export default function PokemonUpdateForm(props: PokemonUpdateFormProps): React.ReactElement<any>;
