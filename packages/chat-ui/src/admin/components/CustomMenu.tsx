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
    <Menu.DashboardItem />
    <Menu.Item to="/forces" primaryText="Forces" leftIcon={<GroupIcon />} />
    <Menu.Item to="/rooms" primaryText="Rooms" leftIcon={<RoomIcon />} />
    <Menu.Item to="/templates" primaryText="Templates" leftIcon={<TemplateIcon />} />
    <Menu.Item to="/overview/edit" primaryText="Overview" leftIcon={<OverviewIcon />} />
  </Menu>
);
