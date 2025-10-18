/**
 * Game Layout Component
 * Multi-column layout for room columns using flexlayout-react
 */

import { useEffect, useRef } from 'react';
import { Layout, Model, TabNode, IJsonModel } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { useRoomsStore, selectAllRooms } from '@war-rooms/state';
import { ChatRoom } from './ChatRoom';

export function GameLayout() {
  const allRooms = useRoomsStore(selectAllRooms);
  const modelRef = useRef<Model | null>(null);

  // Initialize flexlayout model
  useEffect(() => {
    const json: IJsonModel = {
      global: {
        tabEnableClose: false,
        tabEnableFloat: false,
        splitterSize: 8,
      },
      borders: [],
      layout: {
        type: 'row',
        weight: 100,
        children: allRooms
          .filter((room) => {
            // Exclude all-hands from game area (it's in OutOfGamePanel)
            return !room.info.jid.startsWith('all-hands@');
          })
          .map((room) => ({
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: room.info.info.identity.name,
                component: 'room',
                config: { roomJid: room.info.jid },
              },
            ],
          })),
      },
    };

    // If no game rooms, show placeholder
    if (json.layout.children.length === 0) {
      json.layout = {
        type: 'row',
        weight: 100,
        children: [
          {
            type: 'tabset',
            weight: 100,
            children: [
              {
                type: 'tab',
                name: 'No Rooms',
                component: 'placeholder',
              },
            ],
          },
        ],
      };
    }

    modelRef.current = Model.fromJson(json);
  }, [allRooms]);

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const config = node.getConfig();

    if (component === 'room') {
      return <ChatRoom roomJid={config.roomJid} />;
    }

    if (component === 'placeholder') {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          No game rooms assigned
        </div>
      );
    }

    return <div>Unknown component: {component}</div>;
  };

  if (!modelRef.current) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Layout model={modelRef.current} factory={factory} />
    </div>
  );
}
