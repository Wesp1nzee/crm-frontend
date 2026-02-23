import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { Business, Email, LocationOn, Person, Phone, Scale } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useClient } from '../../shared/hooks/useClients';

const clientTypeLabel: Record<string, string> = {
  legal: 'Юридическое лицо',
  individual: 'Физическое лицо',
  court: 'Суд',
};

const contactTypeLabel: Record<string, string> = {
  legal_representative: 'Представитель',
  court_officer: 'Сотрудник суда',
  individual: 'Контактное лицо',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ py: 1.25 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" color={value ? 'text.primary' : 'text.disabled'}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading, error } = useClient(id!);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !client) {
    return <Alert severity="error">Не удалось загрузить карточку клиента</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(79,144,255,0.16) 0%, rgba(18,18,18,0.6) 100%)'
              : 'linear-gradient(180deg, rgba(79,144,255,0.07) 0%, rgba(255,255,255,0.98) 100%)',
        }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>{client.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Полная карточка клиента
              </Typography>
            </Box>
            <Chip
              icon={<Business />}
              label={clientTypeLabel[client.type] ?? client.type}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Основная информация
              </Typography>
              <Divider sx={{ mb: 1 }} />

              <InfoRow label="Краткое название" value={client.short_name} />
              <InfoRow label="ИНН" value={client.inn} />
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Телефон" value={client.phone} />
              <InfoRow label="Юридический адрес" value={client.legal_address} />
              <InfoRow label="Фактический адрес" value={client.actual_address} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Статистика
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              <Stack spacing={1.25}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Scale fontSize="small" color="action" />
                  <Typography variant="body2">Активных дел: <b>{client.active_cases}</b></Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Scale fontSize="small" color="action" />
                  <Typography variant="body2">Всего дел: <b>{client.total_cases}</b></Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Создан: {new Date(client.created_at).toLocaleString('ru-RU')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Обновлен: {new Date(client.updated_at).toLocaleString('ru-RU')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Контакты ({client.contacts.length})
              </Typography>
              <Divider sx={{ mb: 1 }} />

              {client.contacts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Контакты пока не добавлены.</Typography>
              ) : (
                <List dense sx={{ p: 0 }}>
                  {client.contacts.map((contact) => (
                    <ListItem key={contact.id} alignItems="flex-start" sx={{ px: 0, py: 1.25 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: contact.is_main ? 'primary.main' : 'grey.500' }}>
                          <Person fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography variant="body1" fontWeight={600}>{contact.name}</Typography>
                            {contact.is_main && <Chip size="small" color="primary" label="Основной" />}
                            <Chip size="small" variant="outlined" label={contactTypeLabel[contact.contact_type] ?? contact.contact_type} />
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {contact.position ? (
                              <Typography variant="caption" color="text.secondary">{contact.position}</Typography>
                            ) : null}
                            {contact.email ? (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Email fontSize="inherit" color="action" />
                                <Typography variant="caption">{contact.email}</Typography>
                              </Box>
                            ) : null}
                            {contact.phone ? (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Phone fontSize="inherit" color="action" />
                                <Typography variant="caption">{contact.phone}</Typography>
                              </Box>
                            ) : null}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Адреса клиента
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box display="flex" alignItems="flex-start" gap={1.25} flex={1}>
              <LocationOn color="action" sx={{ mt: 0.3 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>Юридический</Typography>
                <Typography variant="body2" color={client.legal_address ? 'text.primary' : 'text.secondary'}>
                  {client.legal_address || 'Не указан'}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="flex-start" gap={1.25} flex={1}>
              <LocationOn color="action" sx={{ mt: 0.3 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>Фактический</Typography>
                <Typography variant="body2" color={client.actual_address ? 'text.primary' : 'text.secondary'}>
                  {client.actual_address || 'Не указан'}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
