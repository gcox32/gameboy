"use client";

import { Container, Heading, Paragraph, Card, Section, List, OrderedList } from '@/components/ui';
  
  export default function HowItWorks() {
    return (
      <Container>
        <Heading as="h1">How It Works</Heading>
  
        <Section>
          <Heading as="h2">Overview</Heading>
          <Card>
            <Paragraph>
              This GameBoy emulator is designed to work with any GameBoy (.gb) or GameBoy Color (.gbc) ROM files. 
              While it supports all standard GameBoy games, it includes special features specifically optimized for first-generation Pokémon games (Red, Blue, Green, and Yellow),
              and by extension, ROM hacks based on these games.
            </Paragraph>
            <Paragraph>
              Special Pokémon features include:
            </Paragraph>
            <List>
              <li>Active party monitoring</li>
              <li>Gym badge tracking</li>
              <li>Location-based dynamic backgrounds</li>
              <li>Advanced save state management</li>
            </List>
          </Card>
        </Section>
  
        <Section>
          <Heading as="h2">Getting Started</Heading>
          
          <Heading as="h3">1. Importing Games</Heading>
          <Card>
            <Paragraph>
              To import a game:
            </Paragraph>
            <OrderedList>
              <li>Click the "Import Game" button in your library</li>
              <li>Upload your .gb or .gbc ROM file</li>
              <li>Select a preset cover image or upload your own</li>
              <li>Fill in the game details</li>
              <li>For Pokémon games, verify the memory watcher configurations</li>
            </OrderedList>
          </Card>
  
          <Heading as="h3">2. Memory Watcher Configuration</Heading>
          <Card>
            <Paragraph>
              For Pokémon games, memory watchers need to be properly configured to enable special features. Default values are:
            </Paragraph>
            <List>
              <li>Active Party: Base Address: 0xD163, Offset: 0x00, Size: 0x195</li>
              <li>Gym Badges: Base Address: 0xD2F6, Offset: 0x60, Size: 0x1</li>
              <li>Location: Base Address: 0xD2F6, Offset: 0x68, Size: 0x1</li>
            </List>
            <Paragraph>
              Troubleshooting Tips:
            </Paragraph>
            <List>
              <li>Pokémon Blue (Original): Location offset should be 0x68</li>
              <li>If party data isn't showing, try adjusting the base address by ±1</li>
              <li>Different ROM versions may require slightly different memory addresses</li>
            </List>
          </Card>
  
          <Heading as="h3">3. Save States</Heading>
          <Card>
            <Paragraph>
              The emulator supports two types of saves:
            </Paragraph>
            <List>
              <li>In-game saves (just like on a real GameBoy)</li>
              <li>Save states (save at any point in the game)</li>
            </List>
            <Paragraph>
              To create a save state:
            </Paragraph>
            <OrderedList>
              <li>Pause the game</li>
              <li>Click "Create Save State"</li>
              <li>Add a description (optional)</li>
              <li>Your save state will be stored in the cloud</li>
            </OrderedList>
          </Card>
        </Section>
  
        <Section>
          <Heading as="h2">Advanced Features</Heading>
          <Card>
            <Heading as="h4">Dynamic Backgrounds</Heading>
            <Paragraph>
              In Pokémon games, the background will automatically change based on your in-game location when enabled in settings.
            </Paragraph>
  
            <Heading as="h4">Performance Settings</Heading>
            <Paragraph>
              Adjust emulation speed and sound settings in the control panel. Mobile users can also adjust zoom levels for better visibility.
            </Paragraph>
          </Card>
        </Section>
      </Container>
    );
  }