import dayjs from 'dayjs';

import type { Client } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type CreateClientInput = Pick<Client, 'name' | 'phone'> & Partial<Pick<Client, 'notes'>>;

class ClientsService {
  async list() {
    const clients = await dataRepository.getClients();
    return [...clients].sort((first, second) => first.name.localeCompare(second.name));
  }

  async create(input: CreateClientInput): Promise<Client> {
    const now = dayjs().toISOString();
    const notes = input.notes?.trim();

    const client: Client = {
      id: createId('client'),
      name: input.name.trim(),
      phone: input.phone.trim(),
      createdAt: now,
      updatedAt: now,
    };
    if (notes) {
      client.notes = notes;
    }

    const clients = await dataRepository.getClients();
    await dataRepository.setClients([client, ...clients]);

    return client;
  }
}

export const clientsService = new ClientsService();
