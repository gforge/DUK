import CheckIcon from '@mui/icons-material/Check';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import { Avatar, ButtonBase, Divider, ListItemIcon, ListItemText, ListSubheader, Menu, MenuItem, Typography, } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useRoleLabel } from '@/hooks/labels';
import { useRole } from '@/store/roleContext';
import { tokens } from '@/theme';

import { LANGUAGES } from './languages';
function initials(name: string) {
    return name
        .replace(/^(Dr|SSK)\.?\s+/i, '')
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
/** Account menu behind the user's name and avatar: identity, language and logout. */
export default function RoleSwitcher() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const getRoleLabel = useRoleLabel();
    const { currentUser, logout, authProviderName, session } = useRole();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleLogout = async () => {
        await logout();
        setAnchorEl(null);
        navigate('/login', { replace: true });
    };
    return (<>
      <ButtonBase aria-label={t('role.accountMenu', { defaultValue: 'Account' })} aria-haspopup="true" aria-expanded={Boolean(anchorEl)} onClick={(e) => setAnchorEl(e.currentTarget)} sx={{
            font: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: tokens.text2,
            borderRadius: 2,
            px: 0.5,
            py: 0.5,
            '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
        }}>
        <Typography component="span" sx={{ display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
          {currentUser.name}
        </Typography>
        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, bgcolor: 'primary.main' }}>
          {initials(currentUser.name)}
        </Avatar>
      </ButtonBase>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <Typography variant="subtitle2" sx={{ px: 2, pt: 1 }}>
          {currentUser.name}
        </Typography>
        <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block', opacity: 0.65 }}>
          {getRoleLabel(currentUser.role)} · {authProviderName}
        </Typography>
        <Divider />
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', opacity: 0.65 }}>
          Session expires {new Date(session.expiresAt).toLocaleTimeString()}
        </Typography>
        <Divider />
        <ListSubheader sx={{ lineHeight: '32px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageIcon fontSize="small"/>
          {t('common.language')}
        </ListSubheader>
        {LANGUAGES.map((lang) => (<MenuItem key={lang.code} selected={i18n.language === lang.code} onClick={() => {
                void i18n.changeLanguage(lang.code);
                setAnchorEl(null);
            }}>
            <ListItemIcon>{i18n.language === lang.code && <CheckIcon fontSize="small"/>}</ListItemIcon>
            <ListItemText primary={lang.label}/>
          </MenuItem>))}
        <Divider />
        <MenuItem onClick={() => void handleLogout()}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('role.logout', { defaultValue: 'Log out' })}/>
        </MenuItem>
      </Menu>
    </>);
}
