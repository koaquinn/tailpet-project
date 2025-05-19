// src/pages/clientes/ClienteForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Grid, Paper,
  Divider, Switch, FormControlLabel, Alert, CircularProgress,
  Snackbar, Card, CardContent, Fade, InputAdornment, useTheme, alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Home as HomeIcon,
  LocationCity as LocationCityIcon,
  Map as MapIcon,
  Apartment as ApartmentIcon,
  ConfirmationNumber as ConfirmationNumberIcon,
  MarkunreadMailbox as MarkunreadMailboxIcon
} from '@mui/icons-material';
import { 
  getCliente, 
  createCliente, 
  updateCliente, 
  checkRutExists,
  getDireccionesCliente,
  createDireccionCliente,
  updateDireccionCliente
} from '../../api/clienteApi';
import { Cliente, Direccion } from '../../types/cliente';
import { validateRut as validateRutFormat, validateEmail, validatePhone } from '../../utils/formatters';

interface FormErrors {
  [key: string]: string | undefined;
}

interface FieldState {
  isValidated: boolean;
  hasAttemptedInput: boolean;
  isValidating?: boolean;
}

interface ClienteConDireccionFormData extends Cliente {
  direccion_id?: number;
  calle: string;
  numero: string;
  departamento: string;
  ciudad: string;
  region: string;
  codigo_postal: string;
}

const FORM_FIELDS_CLIENTE = [
  {
    name: 'nombre', label: 'Nombre', required: true, maxLength: 100,
    gridProps: { xs: 12, md: 6 }, icon: <PersonIcon />,
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'El nombre es requerido.';
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
      return undefined;
    }
  },
  {
    name: 'apellido', label: 'Apellido', required: true, maxLength: 100,
    gridProps: { xs: 12, md: 6 }, icon: <PersonIcon />,
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'El apellido es requerido.';
      if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres.';
      return undefined;
    }
  },
  {
    name: 'rut', label: 'RUT', required: true, maxLength: 12,
    gridProps: { xs: 12, md: 6 }, icon: <BadgeIcon />, helperText: 'Formato: XX.XXX.XXX-Y',
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'El RUT es requerido.';
      if (!validateRutFormat(value)) return 'RUT inválido. Revisa el formato y el dígito verificador.';
      return undefined;
    },
    asyncValidate: async (value: string, isEditMode: boolean, currentClienteId?: number, originalRut?: string | null): Promise<string | undefined> => {
      if (!validateRutFormat(value)) return undefined;
      const rutHaCambiado = isEditMode && value !== originalRut;
      if (!isEditMode || rutHaCambiado) {
        try {
          const { exists } = await checkRutExists(value, currentClienteId);
          if (exists) return 'Este RUT ya está registrado.';
        } catch (error: any) {
          console.error("Error en asyncValidate para RUT:", error);
          if (error.response && error.response.status === 404) {
            return 'Servicio de verificación de RUT no disponible.';
          }
          return 'Error al verificar el RUT. Por favor, intente más tarde.';
        }
      }
      return undefined;
    }
  },
  {
    name: 'telefono', label: 'Teléfono', required: true, maxLength: 15,
    gridProps: { xs: 12, md: 6 }, icon: <PhoneIcon />, helperText: 'Ej: +56912345678 o 912345678',
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'El teléfono es requerido.';
      if (!validatePhone(value)) return 'Teléfono inválido.';
      return undefined;
    }
  },
  {
    name: 'email', label: 'Email', required: true, maxLength: 100, type: 'email',
    gridProps: { xs: 12 }, icon: <EmailIcon />,
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'El email es requerido.';
      if (!validateEmail(value)) return 'Formato de email inválido. Ej: correo@dominio.cl';
      return undefined;
    }
  }
];

const FORM_FIELDS_DIRECCION = [
  { name: 'calle', label: 'Calle', required: true, maxLength: 255, gridProps: { xs: 12, md: 8 }, icon: <HomeIcon /> },
  { name: 'numero', label: 'Número', required: true, maxLength: 20, gridProps: { xs: 12, md: 4 }, icon: <ConfirmationNumberIcon /> },
  { name: 'departamento', label: 'Departamento (Opcional)', required: false, maxLength: 50, gridProps: { xs: 12, md: 6 }, icon: <ApartmentIcon /> },
  { name: 'codigo_postal', label: 'Código Postal (Opcional)', required: false, maxLength: 20, gridProps: { xs: 12, md: 6 }, icon: <MarkunreadMailboxIcon /> },
  { name: 'ciudad', label: 'Ciudad', required: true, maxLength: 100, gridProps: { xs: 12, md: 6 }, icon: <LocationCityIcon /> },
  { name: 'region', label: 'Región', required: true, maxLength: 100, gridProps: { xs: 12, md: 6 }, icon: <MapIcon /> },
];

const ALL_FORM_FIELDS = [...FORM_FIELDS_CLIENTE, ...FORM_FIELDS_DIRECCION.map(f => ({
  ...f,
  validate: (value: string): string | undefined => {
    if (f.required && !value.trim()) return `${f.label} es requerido.`;
    return undefined;
  }
}))];

const DEFAULT_FORM_DATA: ClienteConDireccionFormData = {
  nombre: '',
  apellido: '',
  rut: '',
  telefono: '',
  email: '',
  activo: true,
  direccion_id: undefined,
  calle: '',
  numero: '',
  departamento: '',
  comuna: '',
  ciudad: '',
  region: '',
  codigo_postal: '',
};

const ClienteForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const theme = useTheme();

  const [originalRut, setOriginalRut] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean; message: string; severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState<ClienteConDireccionFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const [fieldStates, setFieldStates] = useState<{ [key: string]: FieldState }>(
    ALL_FORM_FIELDS.reduce((acc, field) => {
      acc[field.name] = { isValidated: false, hasAttemptedInput: false, isValidating: false };
      return acc;
    }, {} as { [key: string]: FieldState })
  );

  useEffect(() => {
    const fetchClienteData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const clienteData = await getCliente(Number(id));
        let direccionPrincipal: Direccion | null = null;
        
        try {
          const direccionesResponse = await getDireccionesCliente(Number(id));
          if (direccionesResponse?.results?.length > 0) {
            direccionPrincipal = direccionesResponse.results.find((dir: Direccion) => dir.es_principal) || direccionesResponse.results[0];
          }
        } catch (dirError) {
          console.warn("No se pudieron cargar las direcciones del cliente:", dirError);
        }

        setFormData({
          id: clienteData.id,
          nombre: clienteData.nombre || '',
          apellido: clienteData.apellido || '',
          rut: clienteData.rut || '',
          telefono: clienteData.telefono || '',
          email: clienteData.email || '',
          activo: clienteData.activo !== undefined ? clienteData.activo : true,
          direccion_id: direccionPrincipal?.id,
          calle: direccionPrincipal?.calle || '',
          numero: direccionPrincipal?.numero || '',
          departamento: direccionPrincipal?.departamento || '',
          comuna: direccionPrincipal?.comuna || '',
          ciudad: direccionPrincipal?.ciudad || '',
          region: direccionPrincipal?.region || '',
          codigo_postal: direccionPrincipal?.codigo_postal || '',
        });
        setOriginalRut(clienteData.rut || null);
        
        const initialFieldStates: { [key: string]: FieldState } = {};
        ALL_FORM_FIELDS.forEach(field => {
          const value = (formData as any)[field.name] || (clienteData as any)[field.name] || (direccionPrincipal as any)?.[field.name.replace('direccion_','')] || '';
          const error = field.validate?.(String(value), isEdit, clienteData.id);
          initialFieldStates[field.name] = { 
            isValidated: !!String(value).trim() && !error,
            hasAttemptedInput: false,
            isValidating: false
          };
        });
        setFieldStates(initialFieldStates);
        setErrors({});
        setHasChanges(false);

      } catch (error) {
        showNotification('Error al cargar los datos del cliente', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isEdit) {
      fetchClienteData();
    } else {
      const initialFieldStates: { [key: string]: FieldState } = {};
      ALL_FORM_FIELDS.forEach(field => {
        initialFieldStates[field.name] = { isValidated: false, hasAttemptedInput: false, isValidating: false };
      });
      setFieldStates(initialFieldStates);
    }
  }, [isEdit, id]);

  const validateSingleField = async (name: string, value: string): Promise<string | undefined> => {
    const config = ALL_FORM_FIELDS.find(f => f.name === name);
    if (!config) return undefined;

    let error = config.validate?.(value, isEdit, id ? Number(id) : undefined);
    if (error) return error;

    if (config.name === 'rut' && (config as any).asyncValidate) {
      const rutHaCambiado = isEdit && value !== originalRut;
      if (!isEdit || rutHaCambiado) {
        setFieldStates(prev => ({ ...prev, [name]: { ...prev[name], isValidating: true } }));
        try {
          error = await (config as any).asyncValidate(value, isEdit, id ? Number(id) : undefined, originalRut);
        } catch (e) { error = "Error al verificar RUT."; } 
        finally { setFieldStates(prev => ({ ...prev, [name]: { ...prev[name], isValidating: false } })); }
      }
    }
    return error;
  };

  const runAllValidations = async (showValidationErrors: boolean = true): Promise<boolean> => {
    const newErrors: FormErrors = {};
    let formIsValid = true;
    const updatedFieldStates: { [key: string]: FieldState } = {};

    for (const field of ALL_FORM_FIELDS) {
      const fieldName = field.name;
      const fieldValue = String((formData as any)[fieldName] || '');
      let error = await validateSingleField(fieldName, fieldValue);

      if (error) {
        if (showValidationErrors) newErrors[fieldName] = error;
        formIsValid = false;
        updatedFieldStates[fieldName] = { ...fieldStates[fieldName], isValidated: false, hasAttemptedInput: true, isValidating: fieldStates[fieldName]?.isValidating };
      } else {
        updatedFieldStates[fieldName] = { ...fieldStates[fieldName], isValidated: !!fieldValue.trim() || !field.required, hasAttemptedInput: true, isValidating: fieldStates[fieldName]?.isValidating };
      }
    }
    if (showValidationErrors) setErrors(newErrors);
    setFieldStates(prev => ({...prev, ...updatedFieldStates}));
    return formIsValid;
  };
  
  const debouncedValidateRut = useCallback(
    async (rutValue: string) => {
      const fieldConfig = ALL_FORM_FIELDS.find(f => f.name === 'rut') as typeof FORM_FIELDS_CLIENTE[2] | undefined;
      if (!fieldConfig || !fieldConfig.asyncValidate) return;

      if (!validateRutFormat(rutValue)) {
        setErrors(prev => ({ ...prev, rut: 'RUT con formato inválido.' }));
        setFieldStates(prev => ({ ...prev, rut: { ...prev.rut, isValidated: false, isValidating: false, hasAttemptedInput: true } }));
        return;
      }
      
      const rutHaCambiado = isEdit && rutValue !== originalRut;
      if (!isEdit || rutHaCambiado) {
        setFieldStates(prev => ({ ...prev, rut: { ...prev.rut, isValidating: true, hasAttemptedInput: true } }));
        try {
          const error = await fieldConfig.asyncValidate(rutValue, isEdit, id ? Number(id) : undefined, originalRut);
          setErrors(prev => ({ ...prev, rut: error }));
          setFieldStates(prev => ({ ...prev, rut: { ...prev.rut, isValidated: !error, isValidating: false } }));
        } catch (e) { /* ... */ }
      } else if (isEdit && rutValue === originalRut) {
          setErrors(prev => ({...prev, rut: undefined}));
          setFieldStates(prev => ({...prev, rut: {...prev.rut, isValidated: true, isValidating: false, hasAttemptedInput: true}}));
      }
    },
    [isEdit, originalRut, id] 
  );

  useEffect(() => {
    const rutValue = formData.rut;
    if (rutValue && validateRutFormat(rutValue)) {
        const rutHaCambiado = isEdit && rutValue !== originalRut;
        if (!isEdit || rutHaCambiado) {
            const handler = setTimeout(() => { debouncedValidateRut(rutValue); }, 1000);
            return () => { clearTimeout(handler); };
        } else if (isEdit && rutValue === originalRut) {
             if (errors.rut === 'Este RUT ya está registrado.' || errors.rut === 'No se pudo verificar el RUT.') {
                setErrors(prev => ({ ...prev, rut: undefined }));
            }
            setFieldStates(prev => ({ ...prev, rut: { ...prev.rut, isValidated: true, isValidating: false, hasAttemptedInput: true } }));
        }
    }
  }, [formData.rut, debouncedValidateRut, isEdit, originalRut]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
  
    setFormData(prev => ({ ...prev, [name]: inputValue }));
    if (!hasChanges) setHasChanges(true);
  
    const fieldConfig = ALL_FORM_FIELDS.find(f => f.name === name);
    const syncError = fieldConfig?.validate?.(String(inputValue), isEdit, id ? Number(id) : undefined);
    
    setErrors(prev => ({ ...prev, [name]: syncError }));
    setFieldStates(prev => ({
      ...prev,
      [name]: {
        isValidated: !syncError && (!!String(inputValue).trim() || !(fieldConfig?.required)),
        hasAttemptedInput: true,
        isValidating: name === 'rut' ? prev[name]?.isValidating : false
      }
    }));
  };

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFieldStates(prev => ({ ...prev, [name]: { ...prev[name], hasAttemptedInput: true } }));
    const error = await validateSingleField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFieldStates(prev => ({ 
        ...prev, 
        [name]: { 
            ...prev[name], 
            isValidated: !error && (!!value.trim() || !(ALL_FORM_FIELDS.find(f => f.name === name)?.required)) 
        } 
    }));
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => setNotification(prev => ({ ...prev, open: false }));
  const handleCancelAction = () => {
    if (hasChanges) {
      const confirmed = window.confirm('¿Estás seguro de cancelar? Los cambios se perderán.');
      if (confirmed) navigate('/clientes');
    } else {
      navigate('/clientes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formIsValid = await runAllValidations(true);
    if (!formIsValid) {
      showNotification('Por favor, revisa los campos del formulario.', 'warning');
      return;
    }
    setSaving(true);

    const clientePayload: Cliente = {
      id: formData.id,
      nombre: formData.nombre,
      apellido: formData.apellido,
      rut: formData.rut,
      telefono: formData.telefono,
      email: formData.email,
      activo: formData.activo,
    };

    try {
      let savedCliente: Cliente;
      if (isEdit && clientePayload.id) {
        savedCliente = await updateCliente(clientePayload.id, clientePayload);
        showNotification('Cliente actualizado correctamente.', 'success');
      } else {
        const { id: clienteIdToRemove, ...clienteToCreate } = clientePayload;
        savedCliente = await createCliente(clienteToCreate as Cliente);
        showNotification('Cliente creado correctamente.', 'success');
      }

      if (formData.calle.trim() && formData.numero.trim() && savedCliente.id) {
        const direccionPayload: Direccion = {
          id: formData.direccion_id,
          cliente: savedCliente.id,
          calle: formData.calle,
          numero: formData.numero,
          departamento: formData.departamento || null,
          comuna: formData.comuna || null,
          ciudad: formData.ciudad,
          region: formData.region,
          codigo_postal: formData.codigo_postal || null,
          es_principal: true,
        };

        try {
          if (direccionPayload.id) {
            await updateDireccionCliente(direccionPayload.id, direccionPayload);
          } else {
            const { id: dirIdToRemove, ...direccionToCreate } = direccionPayload;
            await createDireccionCliente(direccionToCreate as Omit<Direccion, 'id'>);
          }
        } catch (dirError: any) {
          const dirApiError = dirError.response?.data;
          let dirErrorMsg = isEdit ? 'Error al actualizar la dirección.' : 'Error al crear la dirección.';
          if (dirApiError && typeof dirApiError === 'object') {
            const detail = dirApiError.detail;
            if (detail) dirErrorMsg = detail;
            else {
              const generalDirError = Object.values(dirApiError).find(val => typeof val === 'string' || (Array.isArray(val) && typeof val[0] === 'string'));
              if(generalDirError) dirErrorMsg = Array.isArray(generalDirError) ? generalDirError.join(' ') : String(generalDirError);
            }
          }
          showNotification(`${isEdit ? 'Cliente actualizado' : 'Cliente creado'}, pero ${dirErrorMsg}`, 'warning');
          console.error("Error guardando dirección:", dirError);
        }
      }
      setTimeout(() => navigate('/clientes'), 1800);

    } catch (error: any) {
      const apiError = error.response?.data;
      let errorMsg = 'Error al guardar el cliente. Inténtalo de nuevo.';
      if (apiError && typeof apiError === 'object') {
        const detail = apiError.detail;
        const rutApiError = apiError.rut; 
        if (detail) errorMsg = detail;
        else if (rutApiError) {
          setErrors(prev => ({...prev, rut: Array.isArray(rutApiError) ? rutApiError.join(' ') : String(rutApiError)}));
          setFieldStates(prev => ({...prev, rut: {...prev.rut, isValidated: false}}));
          errorMsg = Array.isArray(rutApiError) ? rutApiError.join(' ') : String(rutApiError); 
        } else {
          const generalError = Object.values(apiError).find(val => typeof val === 'string' || (Array.isArray(val) && typeof val[0] === 'string'));
          if(generalError) errorMsg = Array.isArray(generalError) ? generalError.join(' ') : String(generalError);
        }
      }
      showNotification(errorMsg, 'error');
      console.error('Error en handleSubmit (cliente):', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Container className="cliente-form-container">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="textSecondary">
            Cargando información del cliente...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="cliente-form-container">
      <Fade in timeout={800}>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/clientes')}
              className="cliente-form-button cliente-form-button-outline"
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1
              }}
            >
              Volver a lista de clientes
            </Button>
          </Box>
          
          <Paper 
            className="cliente-form-card" 
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                p: 3,
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{
                    background: theme.palette.primary.main,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PersonAddIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {isEdit 
                      ? 'Modifica la información del cliente existente'
                      : 'Completa la información para crear un nuevo cliente'
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 3, 
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}
                    >
                      Información Personal
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {FORM_FIELDS_CLIENTE.map((field) => {
                        const fieldName = field.name;
                        const hasError = !!errors[fieldName];
                        const currentFieldState = fieldStates[fieldName] || { isValidated: false, hasAttemptedInput: false, isValidating: false };
                        const fieldValue = (formData as any)[fieldName] ?? '';
                        const showValidationIcon = (currentFieldState.hasAttemptedInput || (isEdit && !!fieldValue)) && !currentFieldState.isValidating;
                        
                        return (
                          <Grid item {...field.gridProps} key={fieldName}>
                            <TextField
                              fullWidth
                              label={field.label}
                              name={fieldName}
                              type={(field as any).type || 'text'}
                              value={fieldValue}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={hasError && currentFieldState.hasAttemptedInput}
                              helperText={(hasError && currentFieldState.hasAttemptedInput) ? errors[fieldName] : (field.helperText || (field.required ? ' ' : ''))}
                              required={field.required}
                              disabled={saving}
                              inputProps={{ maxLength: field.maxLength }}
                              className="cliente-form-field"
                              InputProps={{
                                startAdornment: field.icon ? (
                                  <InputAdornment position="start">
                                    <Box sx={{ color: hasError ? 'error.main' : 'action.active' }}>
                                      {field.icon}
                                    </Box>
                                  </InputAdornment>
                                ) : null,
                                endAdornment: (
                                  <>
                                    {currentFieldState.isValidating && (
                                      <InputAdornment position="end">
                                        <CircularProgress size={20} thickness={4} />
                                      </InputAdornment>
                                    )}
                                    {showValidationIcon && !currentFieldState.isValidating && (
                                      currentFieldState.isValidated && !hasError ? (
                                        <InputAdornment position="end">
                                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                        </InputAdornment>
                                      ) : hasError && currentFieldState.hasAttemptedInput ? (
                                        <InputAdornment position="end">
                                          <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                        </InputAdornment>
                                      ) : null
                                    )}
                                  </>
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: theme.palette.primary.main,
                                    }
                                  },
                                  '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderWidth: 2,
                                    }
                                  }
                                }
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 3, 
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}
                    >
                      Dirección Principal
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {FORM_FIELDS_DIRECCION.map((field) => {
                        const fieldName = field.name;
                        const hasError = !!errors[fieldName];
                        const currentFieldState = fieldStates[fieldName] || { isValidated: false, hasAttemptedInput: false, isValidating: false };
                        const fieldValue = (formData as any)[fieldName] ?? '';
                        const showValidationIcon = (currentFieldState.hasAttemptedInput || (isEdit && !!fieldValue)) && !currentFieldState.isValidating;
                        
                        return (
                          <Grid item {...field.gridProps} key={fieldName}>
                            <TextField
                              fullWidth
                              label={field.label}
                              name={fieldName}
                              type={(field as any).type || 'text'}
                              value={fieldValue}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={hasError && currentFieldState.hasAttemptedInput}
                              helperText={(hasError && currentFieldState.hasAttemptedInput) ? errors[fieldName] : ( (field as any).helperText || (field.required ? ' ' : ''))}
                              required={field.required}
                              disabled={saving}
                              inputProps={{ maxLength: field.maxLength }}
                              className="cliente-form-field"
                              InputProps={{
                                startAdornment: (field as any).icon ? (
                                  <InputAdornment position="start">
                                    <Box sx={{ color: hasError ? 'error.main' : 'action.active' }}>
                                      {(field as any).icon}
                                    </Box>
                                  </InputAdornment>
                                ) : null,
                                endAdornment: showValidationIcon && !currentFieldState.isValidating && (
                                  currentFieldState.isValidated && !hasError ? (
                                    <InputAdornment position="end">
                                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                    </InputAdornment>
                                  ) : hasError && currentFieldState.hasAttemptedInput ? (
                                    <InputAdornment position="end">
                                      <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                    </InputAdornment>
                                  ) : null
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: theme.palette.primary.main,
                                    }
                                  },
                                  '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderWidth: 2,
                                    }
                                  }
                                }
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}
                    >
                      Configuración
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 2,
                        background: alpha(theme.palette.primary.main, 0.02),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.activo}
                              onChange={handleChange}
                              name="activo"
                              color="primary"
                              disabled={saving}
                              className="cliente-form-switch"
                              size="medium"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight={500}>
                                Cliente Activo
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {formData.activo 
                                  ? 'El cliente está activo y puede realizar transacciones'
                                  : 'El cliente está inactivo y no puede realizar transacciones'
                                }
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancelAction}
                        disabled={saving}
                        startIcon={<CancelIcon />}
                        className="cliente-form-button cliente-form-button-outline"
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500,
                          px: 3,
                          py: 1.5,
                          minWidth: 120
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        startIcon={saving ? 
                          <CircularProgress size={20} className="cliente-form-spinner" sx={{ color: 'white' }} /> : 
                          <SaveIcon />
                        }
                        disabled={saving}
                        className="cliente-form-button cliente-form-button-primary"
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                          minWidth: 140,
                          boxShadow: 3,
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {saving ? 'Guardando...' : isEdit ? 'Actualizar Cliente' : 'Crear Cliente'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Paper>
        </Box>
      </Fade>
      
      <Snackbar 
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          className="cliente-form-notification"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: 6
          }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClienteForm;