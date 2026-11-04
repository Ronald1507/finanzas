/**
 * Combobox reutilizable con búsqueda por escritura (typeahead), basado en MUI Autocomplete.
 * Reemplaza a los Select tradicionales: el usuario puede escribir para filtrar opciones.
 *
 * Sirve tanto para formularios (con required/error) como para filtros (clearable).
 *
 * @module shared/components/ComboBox
 */
import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

/**
 * Combobox controlado sobre una lista de opciones { value, label }.
 *
 * @param {Object} props
 * @param {string} props.label - Etiqueta del campo.
 * @param {Array<{value: *, label: string}>} props.options - Opciones disponibles.
 * @param {*} props.value - Valor primitivo seleccionado ('' = ninguno).
 * @param {Function} props.onChange - Callback (nuevoValorPrimitivo) => void.
 * @param {string} [props.error] - Mensaje de error (activa el estado de error).
 * @param {string} [props.helperText] - Texto de ayuda cuando no hay error.
 * @param {boolean} [props.required=false] - Marca el campo como obligatorio (asterisco).
 * @param {boolean} [props.disabled=false] - Deshabilita el campo.
 * @param {'small'|'medium'} [props.size='medium'] - Tamaño del input.
 * @param {string} [props.placeholder] - Placeholder del input.
 * @param {Function} [props.getOptionDisabled] - (option) => boolean para deshabilitar opciones.
 * @param {string} [props.testId] - data-testid del input.
 * @param {Object} [props.sx] - Estilos MUI sx aplicados al Autocomplete.
 * @param {Function} [props.renderOption] - Custom renderOption para Autocomplete (props, option) => node.
 * @returns {JSX.Element}
 */
export default function ComboBox({
    label,
    options = [],
    value,
    onChange,
    error = '',
    helperText = '',
    required = false,
    disabled = false,
    size = 'medium',
    placeholder = '',
    getOptionDisabled,
    fullWidth = true,
    testId,
    sx,
    renderOption,
}) {
    const selected = options.find((o) => String(o.value) === String(value)) ?? null;

    return (
        <Autocomplete
            options={options}
            value={selected}
            onChange={(_, opt) => onChange(opt ? opt.value : '')}
            getOptionLabel={(o) => (o?.label ?? '')}
            isOptionEqualToValue={(o, v) => String(o.value) === String(v.value)}
            getOptionDisabled={getOptionDisabled}
            disabled={disabled}
            size={size}
            fullWidth={fullWidth}
            noOptionsText="Sin coincidencias"
            sx={sx}
            {...(renderOption && { renderOption })}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    error={!!error}
                    helperText={error || helperText}
                    placeholder={placeholder}
                    inputProps={{ ...params.inputProps, 'data-testid': testId }}
                />
            )}
        />
    );
}
