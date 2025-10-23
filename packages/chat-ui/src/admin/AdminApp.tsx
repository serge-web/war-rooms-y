/**
 * Admin UI Application
 * React-Admin v5 with OpenFire REST API + PubSub metadata
 */

import { Admin, Resource, Layout } from 'react-admin';
import { createDataProvider } from './providers/dataProvider';
import { createAuthProvider } from '@war-rooms/backend-mock';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { CustomMenu } from './components/CustomMenu';

// Overview resource (single game record)
import { OverviewEdit, OverviewShow } from './resources/overview';

// Forces resource (OpenFire Groups + PubSub metadata)
import { ForceList, ForceEdit, ForceCreate, ForceShow } from './resources/forces';

// Rooms resource (MUC + PubSub metadata)
import { RoomList, RoomEdit, RoomCreate } from './resources/rooms';

// Templates resource (placeholder)
import { TemplateList } from './resources/templates';

// ============================================================================
// Main Admin App Component
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLayout = (props: any) => <Layout {...props} menu={CustomMenu} />;

export default function AdminApp() {
  const namespace = import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';

  return (
    <Admin
      dataProvider={createDataProvider()}
      authProvider={createAuthProvider(namespace)}
      loginPage={LoginPage}
      dashboard={Dashboard}
      layout={CustomLayout}
      title="War Rooms Y - Admin"
    >
      <Resource
        name="forces"
        list={ForceList}
        edit={ForceEdit}
        create={ForceCreate}
        show={ForceShow}
        recordRepresentation="name"
        options={{ label: 'Forces' }}
      />

      <Resource
        name="rooms"
        list={RoomList}
        edit={RoomEdit}
        create={RoomCreate}
        recordRepresentation="naturalName"
        options={{ label: 'Rooms' }}
      />

      <Resource name="templates" list={TemplateList} options={{ label: 'Templates' }} />

      <Resource
        name="overview"
        edit={OverviewEdit}
        show={OverviewShow}
        recordRepresentation="title"
        options={{ label: 'Overview' }}
      />
    </Admin>
  );
}
