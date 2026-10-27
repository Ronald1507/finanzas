/**
 * Hook para gestionar el estado de un dialog CRUD (crear/editar)
 * con validación del servidor.
 *
 * @module shared/hooks/useDialogState
 */
import { useState, useCallback } from 'react';

/**
 * Hook para gestionar el estado de un dialog CRUD.
 *
 * @param {Object} service - Service de la feature
 * @param {Object} emptyState - Estado inicial vacío del formulario
 * @param {Object} options
 * @param {Function[]} [options.onSuccess=[]] - Callbacks al guardar exitosamente
 * @param {Function} [options.validate] - Validador cliente: recibe formData y devuelve
 *        errores { campo: ['msg'] } o null. Si devuelve errores, se aborta el guardado.
 * @returns {Object}
 * @returns {boolean} returns.open - Si el dialog está abierto
 * @returns {Object} returns.formData - Datos del formulario
 * @returns {Object|null} returns.errors - Errores de validación del servidor
 * @returns {boolean} returns.saving - Indicador de guardado en progreso
 * @returns {Function} returns.openNew - Abre dialog para crear nuevo
 * @returns {Function} returns.openEdit - Abre dialog para editar (recibe item)
 * @returns {Function} returns.close - Cierra el dialog
 * @returns {Function} returns.setField - Actualiza un campo individual
 * @returns {Function} returns.setFormData - Setter completo del form
 * @returns {Function} returns.setErrors - Setter de errores
 * @returns {Function} returns.save - Guarda (POST o PUT según formData.id)
 */
export default function useDialogState(service, emptyState, { onSuccess = [], validate } = {}) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(emptyState);
    const [errors, setErrors] = useState(null);
    const [saving, setSaving] = useState(false);

    const openNew = useCallback(() => {
        setFormData(emptyState);
        setErrors(null);
        setOpen(true);
    }, [emptyState]);

    const openEdit = useCallback((item) => {
        const data = {};
        Object.keys(emptyState).forEach((key) => {
            data[key] = item[key] !== undefined ? item[key] : '';
        });
        data.id = item.id;
        setFormData(data);
        setErrors(null);
        setOpen(true);
    }, [emptyState]);

    const close = useCallback(() => {
        setOpen(false);
        setErrors(null);
    }, []);

    const setField = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const save = useCallback(async (extraTransform) => {
        setErrors(null);

        // Validación cliente: si falla, mostrar errores por campo y no llamar al servidor.
        if (validate) {
            const clientErrors = validate(formData);
            if (clientErrors) {
                setErrors(clientErrors);
                return null;
            }
        }

        setSaving(true);
        try {
            const payload = extraTransform ? extraTransform(formData) : formData;
            let res;
            if (formData.id) {
                res = await service.update(formData.id, payload);
            } else {
                res = await service.create(payload);
            }
            setOpen(false);
            setFormData(emptyState);
            onSuccess.forEach((cb) => cb(res));
            return res;
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: err.response?.data?.message || 'Ocurrió un error al guardar.' });
            }
            return null;
        } finally {
            setSaving(false);
        }
    }, [service, formData, emptyState, onSuccess, validate]);

    return {
        open,
        formData,
        errors,
        saving,
        openNew,
        openEdit,
        close,
        setField,
        setFormData,
        setErrors,
        save,
    };
}
