jest.mock('@megaorm/builder');

import { MegaBuilder } from '@megaorm/builder';
import { MegaFaker } from '@megaorm/faker';
import { MegaSeederError } from '../src';
import { MegaSeeder } from '../src';

class TestSeeder extends MegaSeeder {}

const mock = {
  builder: (reject: boolean = false) => {
    const builder = new (MegaBuilder as any)();
    const promise = reject
      ? Promise.reject(new Error('Ops'))
      : Promise.resolve();

    const insert = {
      into: jest.fn(() => insert),
      rows: jest.fn(() => insert),
      row: jest.fn(() => insert),
      exec: jest.fn(() => promise),
    };

    builder.raw = jest.fn(() => promise);
    builder.insert = jest.fn(() => insert);

    return builder;
  },
};

describe('MegaSeeder', () => {
  let seeder: any;

  beforeEach(() => {
    // Create a new instance of TestSeeder before each test
    seeder = new TestSeeder();
  });

  describe('constructor', () => {
    it('should throw an error when attempting to create an instance of MegaSeeder directly', () => {
      expect(() => new (MegaSeeder as any)()).toThrow(MegaSeederError);
      expect(() => new (MegaSeeder as any)()).toThrow(
        'Cannot construct MegaSeeder instances directly'
      );
    });

    it('should allow instantiation of subclasses of MegaSeeder', () => {
      // Create a subclass of MegaSeeder for testing
      class TestSeeder extends MegaSeeder {}

      // Expect no error when creating an instance of the subclass
      expect(() => new TestSeeder()).not.toThrow();
    });
  });

  describe('set.table', () => {
    it('should set the table name if it is in snake_case', () => {
      expect(seeder.set.table('users')).toBe(seeder);
      expect(seeder.table).toBe('users');
    });

    it('should throw an error if the table name is not in snake_case', () => {
      expect(() => seeder.set.table('Users')).toThrow(MegaSeederError);
      expect(() => seeder.set.table('usersTable')).toThrow(MegaSeederError);
    });
  });

  describe('set.rows', () => {
    it('should set the number of rows if it is a positive integer', () => {
      expect(seeder.set.rows(5)).toBe(seeder);
      expect(seeder.rows).toBe(5);
    });

    it('should throw an error if the rows number is invalid', () => {
      expect(() => seeder.set.rows(0)).toThrow(MegaSeederError);
      expect(() => seeder.set.rows(-1)).toThrow(MegaSeederError);
      expect(() => seeder.set.rows('5' as any)).toThrow(MegaSeederError);
    });
  });

  describe('set.builder', () => {
    it('should set the builder if it is an instance of MegaBuilder', () => {
      const builder = mock.builder();
      expect(seeder.set.builder(builder)).toBe(seeder);
      expect(seeder.builder).toBe(builder);
    });

    it('should throw if the builder is not an instance of MegaBuilder', () => {
      expect(() => seeder.set.builder({} as any)).toThrow(MegaSeederError);
    });
  });

  describe('set.faker', () => {
    it('should set the faker if it is an instance of MegaFaker', () => {
      const faker = new MegaFaker();
      expect(seeder.set.faker(faker)).toBe(seeder);
      expect(seeder.faker).toBe(faker);
    });

    it('should throw if the faker is not an instance of MegaFaker', () => {
      expect(() => seeder.set.faker({} as any)).toThrow(MegaSeederError);
    });
  });

  describe('get.table', () => {
    it('should return the table name if it is in snake_case', () => {
      seeder.table = 'users';
      expect(seeder.get.table()).toBe('users');
    });

    it('should throw an error if the table name is not in snake_case', () => {
      seeder.table = 'Users'; // invalid
      expect(() => seeder.get.table()).toThrow(MegaSeederError);

      seeder.table = 'usersTable'; // invalid
      expect(() => seeder.get.table()).toThrow(MegaSeederError);
    });
  });

  describe('get.rows', () => {
    it('should return the number of rows if it is a positive integer', () => {
      seeder.rows = 5;
      expect(seeder.get.rows()).toBe(5);
    });

    it('should throw an error if the rows number is invalid', () => {
      seeder.rows = 0; // invalid
      expect(() => seeder.get.rows()).toThrow(MegaSeederError);

      seeder.rows = -1; // invalid
      expect(() => seeder.get.rows()).toThrow(MegaSeederError);

      seeder.rows = '5'; // invalid type
      expect(() => seeder.get.rows()).toThrow(MegaSeederError);
    });
  });

  describe('get.builder', () => {
    it('should return the builder instance if it is valid', () => {
      seeder.builder = mock.builder();
      expect(seeder.get.builder()).toBeInstanceOf(MegaBuilder);
    });

    it('should throw an error if the builder is invalid', () => {
      seeder.builder = {} as any;
      expect(() => seeder.get.builder()).toThrow(MegaSeederError);
    });
  });

  describe('get.faker', () => {
    it('should return the faker instance if it is valid', () => {
      seeder.faker = new MegaFaker();
      expect(seeder.get.faker()).toBeInstanceOf(MegaFaker);
    });

    it('should throw an error if the faker is invalid', () => {
      seeder.faker = {} as any; // invalid
      expect(() => seeder.get.faker()).toThrow(MegaSeederError);
    });
  });

  describe('seed', () => {
    it('should seed one row', async () => {
      // Implement layout
      const layout = {
        name: 'simon',
        email: 'simon@gmail.com',
        password: '123abc.z',
      };

      seeder.layout = jest.fn(() => layout);

      // Set rows
      seeder.set.rows(1); // seed one row

      // Set table
      seeder.set.table('users');

      // Set builder
      const builder = mock.builder();
      seeder.set.builder(builder);

      // Expect seed to resolve
      await expect(seeder.seed()).resolves.toBeUndefined();

      // Expect insert to be called
      expect(builder.insert).toHaveBeenCalledTimes(1);

      // Expect into to be called with table name
      expect(builder.insert().into).toHaveBeenCalledTimes(1);
      expect(builder.insert().into).toHaveBeenCalledWith('users');

      // Expect row to be called with row
      expect(builder.insert().row).toHaveBeenCalledTimes(1);
      expect(builder.insert().row).toHaveBeenCalledWith(layout);

      // Expect exec to be called
      expect(builder.insert().exec).toHaveBeenCalledTimes(1);
    });

    it('should seed more than one row', async () => {
      // Implement layout
      const layout = {
        name: 'simon',
        email: 'simon@gmail.com',
        password: '123abc.z',
      };
      seeder.layout = jest.fn(() => layout);

      // Set rows
      seeder.set.rows(2);

      // Set table
      seeder.set.table('users');

      // Set builder
      const builder = mock.builder();
      seeder.set.builder(builder);

      // Expect seed to resolve
      await expect(seeder.seed()).resolves.toBeUndefined();

      // Expect insert to be called
      expect(builder.insert).toHaveBeenCalledTimes(1);

      // Expect into to be called with table name
      expect(builder.insert().into).toHaveBeenCalledTimes(1);
      expect(builder.insert().into).toHaveBeenCalledWith('users');

      // Expect rows to be called with rows
      expect(builder.insert().rows).toHaveBeenCalledTimes(1);
      expect(builder.insert().rows).toHaveBeenCalledWith([layout, layout]);

      // Expect exec to be called
      expect(builder.insert().exec).toHaveBeenCalledTimes(1);
    });

    it('should reject if the layout is invalid', async () => {
      // Override layout method to return an invalid layout
      seeder.layout = jest.fn(() => null);

      // Set rows
      seeder.set.rows(2);

      await expect(seeder.seed()).rejects.toThrow(MegaSeederError);
      await expect(seeder.seed()).rejects.toThrow(
        'Invalid seeder layout in: TestSeeder'
      );
    });

    it('should handle database insertion failures', async () => {
      // Set layout
      seeder.layout = jest.fn(() => ({ name: 'simon' }));

      // Set the builder
      seeder.set.builder(mock.builder(true));

      // Set table
      seeder.set.table('users');

      // Set rows
      seeder.set.rows(2);

      // Expect seed to reject
      await expect(seeder.seed()).rejects.toThrow('Ops');
    });

    it('should handle missing layout', async () => {
      // Set layout => missing

      // Set the builder
      seeder.set.builder(mock.builder());

      // Set table
      seeder.set.table('users');

      // Set rows
      seeder.set.rows(10);

      // Execute seed
      expect(seeder.seed()).rejects.toThrow(
        'Seeder layout is missing in: TestSeeder'
      );
    });

    it('should handle missing builder', async () => {
      // Set layout
      seeder.layout = jest.fn(() => ({ name: 'simon' }));

      // Set the builder => missing

      // Set table
      seeder.set.table('users');

      // Set rows
      seeder.set.rows(10);

      // Execute seed
      expect(seeder.seed()).rejects.toThrow('Invalid builder in: TestSeeder');
    });

    it('should hanlde missing table', async () => {
      // Set layout
      seeder.layout = jest.fn(() => ({ name: 'simon' }));

      // Set the builder
      seeder.set.builder(mock.builder());

      // Set table => missing

      // Set rows
      seeder.set.rows(10);

      // Execute seed
      expect(seeder.seed()).rejects.toThrow(
        'Invalid table name in: TestSeeder'
      );
    });

    it('should handle missing rows', async () => {
      // Set layout
      seeder.layout = jest.fn(() => ({ name: 'simon' }));

      // Set the builder
      seeder.set.builder(mock.builder());

      // Set table
      seeder.set.table('users');

      // Set rows => missing

      // Execute seed
      expect(seeder.seed()).rejects.toThrow(
        'Invalid rows number in: TestSeeder'
      );
    });
  });

  describe('clear', () => {
    it('should resolve when DELETE query succeeds', async () => {
      // Set builder
      seeder.set.builder(mock.builder());

      // Set table
      seeder.set.table('users');

      await expect(seeder.clear()).resolves.toBeUndefined();
      expect(seeder.get.builder().raw).toHaveBeenCalledWith(
        `DELETE FROM ${seeder.get.table()}`
      );
    });

    it('should reject when DELETE query fails', async () => {
      // Set builder
      seeder.set.builder(mock.builder(true)); // Reject

      // Set table
      seeder.set.table('users');

      await expect(seeder.clear()).rejects.toThrow('Ops');
    });
  });
});
