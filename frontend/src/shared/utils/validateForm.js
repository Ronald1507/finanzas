/**
 * Validación de formularios del lado cliente.
 *
 * Produce errores en el MISMO formato que el backend ({ campo: ['mensaje'] }),
 * de modo que los diálogos los renderizan con la lógica de error ya existente
 * (helperText / FormControl error) sin cambios adicionales.
 *
 * @module shared/utils/validateForm
 */

/**
 * Valida `data` contra un mapa de `rules` y devuelve los errores encontrados.
 *
 * Cada regla acepta:
 * - `required` {boolean}  El campo no puede estar vacío.
 * - `type`     {'number'} Fuerza que el valor sea numérico.
 * - `min`      {number}   Valor mínimo (solo type 'number').
 * - `positive` {boolean}  Debe ser mayor a 0 (solo type 'number').
 * - `maxLength`{number}   Largo máximo de texto.
 * - `label`    {string}   Nombre legible del campo para el mensaje.
 *
 * @param {Object} data  Datos del formulario.
 * @param {Object} rules Mapa { campo: regla }.
 * @returns {Object|null} Errores { campo: ['mensaje'] } o null si todo es válido.
 */
export function validateForm(data, rules) {
    const errors = {};

    for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];
        const label = rule.label || field;
        const isEmpty = value === undefined || value === null || value === '';

        if (rule.required && isEmpty) {
            errors[field] = [`${label} es obligatorio.`];
            continue;
        }

        // Campo opcional vacío: no se valida nada más.
        if (isEmpty) continue;

        if (rule.type === 'number') {
            const num = Number(value);
            if (Number.isNaN(num)) {
                errors[field] = [`${label} debe ser un número válido.`];
                continue;
            }
            if (rule.positive && num <= 0) {
                errors[field] = [`${label} debe ser mayor a 0.`];
                continue;
            }
            if (rule.min !== undefined && num < rule.min) {
                errors[field] = [`${label} debe ser mayor o igual a ${rule.min}.`];
                continue;
            }
        }

        if (rule.maxLength && String(value).length > rule.maxLength) {
            errors[field] = [`${label} no puede superar los ${rule.maxLength} caracteres.`];
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}
