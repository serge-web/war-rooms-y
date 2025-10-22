/**
 * Custom Menu for React-Admin
 */

import { Menu } from 'react-admin';
import OverviewIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import RoomIcon from '@mui/icons-material/MeetingRoom';
import TemplateIcon from '@mui/icons-material/Description';

export const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem data-testid="menu-dashboard" />
    <Menu.Item
      to="/forces"
      primaryText="Forces"
      leftIcon={<GroupIcon />}
      data-testid="menu-forces"
    />
    <Menu.Item to="/rooms" primaryText="Rooms" leftIcon={<RoomIcon />} data-testid="menu-rooms" />
    <Menu.Item
      to="/templates"
      primaryText="Templates"
      leftIcon={<TemplateIcon />}
      data-testid="menu-templates"
    />
    <Menu.Item
      to="/overview/edit"
      primaryText="Overview"
      leftIcon={<OverviewIcon />}
      data-testid="menu-overview"
    />
  </Menu>
);
