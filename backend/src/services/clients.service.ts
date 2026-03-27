import dayjs from 'dayjs';

import type { Client } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type CreateClientInput = Pick<Client, 'name' | 'phone'> & Partial<Pick<Client, 'notes'>>;

class ClientsService {
  list() {
    return [...dataRepository.getClients()].sort((first, second) => first.name.localeCompare(second.name));
  }

  create(input: CreateClientInput): Client {
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

    const clients = dataRepository.getClients();
    dataRepository.setClients([client, ...clients]);

    return client;
  }
}

export const clientsService = new ClientsService();
