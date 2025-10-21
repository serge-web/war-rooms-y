/**
 * Admin UI Application
 * React-Admin v5 with OpenFire REST API + PubSub metadata
 */

import { Admin, Resource } from 'react-admin';
import { createDataProvider } from './providers/dataProvider';
import { createAuthProvider } from '@war-rooms/backend-mock';
import { LoginPage } from './components/LoginPage';

// Overview resource (single game record)
import { OverviewEdit, OverviewShow } from './resources/overview';

// Forces resource (OpenFire Groups + PubSub metadata)
import {
  ForceList,
  ForceEdit,
  ForceCreate,
  ForceShow,
} from './resources/forces';

// Rooms resource (MUC + PubSub metadata)
import {
  RoomList,
  RoomEdit,
  RoomCreate,
} from './resources/rooms';

// Templates resource (placeholder)
import { TemplateList } from './resources/templates';

// ============================================================================
// Main Admin App Component
// ============================================================================

export default function AdminApp() {
  const namespace = import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';

  return (
    <Admin
      dataProvider={createDataProvider()}
      authProvider={createAuthProvider(namespace)}
      loginPage={LoginPage}
      title="War Rooms Y - Admin"
    >
      <Resource
        name="overview"
        edit={OverviewEdit}
        show={OverviewShow}
        recordRepresentation="title"
      />

      <Resource
        name="forces"
        list={ForceList}
        edit={ForceEdit}
        create={ForceCreate}
        show={ForceShow}
        recordRepresentation="name"
      />

      <Resource
        name="rooms"
        list={RoomList}
        edit={RoomEdit}
        create={RoomCreate}
        recordRepresentation="naturalName"
      />

      <Resource
        name="templates"
        list={TemplateList}
      />
    </Admin>
  );
}
