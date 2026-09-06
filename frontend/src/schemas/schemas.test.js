import parseWith from './validate.js';

const load = (file) => (name, data) => parseWith(name, () => import(`./${file}`), data);

const vehicle = load('vehicle.schema.js');
const driver = load('driver.schema.js');
const trip = load('trip.schema.js');
const branch = load('branch.schema.js');
const profile = load('profile.schema.js');
const erp = load('erp.schema.js');

describe('schemas — async validation via parseWith', () => {
  it('parseWith resolves the schema module via dynamic import', async () => {
    const out = await vehicle('vehicleSchema', { _id: 'v1' });
    expect(out._id).toBe('v1');
  });

  describe('vehicle.schema.js', () => {
    it('accepts a valid vehicle with all known fields', async () => {
      const v = {
        _id: 'v1',
        registrationNumber: 'KA01AB1234',
        model: 'Tata 407',
        make: 'Tata',
        status: 'active',
        branchId: 'b1',
      };
      expect(await vehicle('vehicleSchema', v)).toEqual(v);
    });

    it('rejects a known field of the wrong type', async () => {
      await expect(vehicle('vehicleSchema', { _id: 123 })).rejects.toThrow();
      await expect(vehicle('vehicleSchema', { registrationNumber: 42 })).rejects.toThrow();
    });

    it('passes unknown extra fields through (.passthrough)', async () => {
      const out = await vehicle('vehicleSchema', { _id: 'v1', fuelType: 'diesel', capacityMt: 9 });
      expect(out.fuelType).toBe('diesel');
      expect(out.capacityMt).toBe(9);
    });

    it('validates lists and list responses', async () => {
      const list = [{ _id: 'v1' }, { _id: 'v2', anything: true }];
      expect(await vehicle('vehicleListSchema', list)).toHaveLength(2);

      const res = { status: 'success', data: list, meta: { total: 2, page: 1 } };
      const parsed = await vehicle('vehicleListResponseSchema', res);
      expect(parsed.data).toHaveLength(2);
      expect(parsed.meta.total).toBe(2);

      const single = await vehicle('vehicleListResponseSchema', {
        status: 'success',
        data: { _id: 'v1' },
      });
      expect(single.data._id).toBe('v1');
    });

    it('validates a single-object response', async () => {
      const res = await vehicle('vehicleResponseSchema', {
        status: 'success',
        data: { _id: 'v1' },
        extra: 1,
      });
      expect(res.data._id).toBe('v1');
      expect(res.extra).toBe(1);
    });
  });

  describe('driver.schema.js', () => {
    it('accepts a valid driver and passes extras through', async () => {
      const d = { _id: 'd1', name: 'Ramesh', licenseNumber: 'DL-123', extraField: 'x' };
      expect(await driver('driverSchema', d)).toEqual(d);
    });

    it('rejects wrong types on known fields', async () => {
      await expect(driver('driverSchema', { mobileNumber: 9876543210 })).rejects.toThrow();
    });

    it('validates list and response envelopes', async () => {
      expect(await driver('driverListSchema', [{ _id: 'd1' }])).toHaveLength(1);
      const res = await driver('driverListResponseSchema', { status: 'ok', data: [{ _id: 'd1' }] });
      expect(res.data[0]._id).toBe('d1');
      const single = await driver('driverResponseSchema', { data: { _id: 'd1' } });
      expect(single.data._id).toBe('d1');
    });
  });

  describe('trip.schema.js', () => {
    it('accepts a valid trip and passes extras through', async () => {
      const t = {
        _id: 't1',
        tripNumber: 'TRP-1',
        status: 'in-transit',
        vehicleId: 'v1',
        driverId: 'd1',
        startDate: '2024-01-15',
        source: 'Mumbai',
        destination: 'Delhi',
        oddField: { nested: true },
      };
      expect(await trip('tripSchema', t)).toEqual(t);
    });

    it('rejects non-string dates and ids', async () => {
      await expect(trip('tripSchema', { startDate: 20240115 })).rejects.toThrow();
      await expect(trip('tripSchema', { vehicleId: {} })).rejects.toThrow();
    });

    it('validates list and response envelopes', async () => {
      expect(await trip('tripListSchema', [])).toEqual([]);
      const res = await trip('tripListResponseSchema', {
        status: 'ok',
        data: [{ _id: 't1' }, { _id: 't2' }],
      });
      expect(res.data).toHaveLength(2);
      const single = await trip('tripResponseSchema', { data: { _id: 't1' } });
      expect(single.data._id).toBe('t1');
    });
  });

  describe('branch.schema.js', () => {
    it('accepts a valid branch and passes extras through', async () => {
      const b = { _id: 'b1', name: 'Hubli', code: 'HBL', city: 'Hubli', anything: [1, 2] };
      expect(await branch('branchSchema', b)).toEqual(b);
    });

    it('rejects wrong types on known fields', async () => {
      await expect(branch('branchSchema', { name: 7 })).rejects.toThrow();
    });

    it('validates list and response envelopes', async () => {
      expect(await branch('branchListSchema', [{ _id: 'b1' }])).toHaveLength(1);
      const listRes = await branch('branchResponseSchema', {
        status: 'ok',
        data: [{ _id: 'b1' }, { _id: 'b2' }],
      });
      expect(listRes.data).toHaveLength(2);
      const singleRes = await branch('branchResponseSchema', { status: 'ok', data: { _id: 'b1' } });
      expect(singleRes.data._id).toBe('b1');
    });
  });

  describe('profile.schema.js', () => {
    it('accepts a valid profile and passes extras through', async () => {
      const p = {
        _id: 'p1',
        companyName: 'GNB',
        ownerEmail: 'o@gnb.in',
        gstin: '22AAAAA0000A1Z5',
        primaryThemeColor: '#ff8800',
        other: 'x',
      };
      expect(await profile('profileSchema', p)).toEqual(p);
    });

    it('rejects wrong types on known fields', async () => {
      await expect(profile('profileSchema', { gstin: 12345 })).rejects.toThrow();
    });

    it('validates the response envelope', async () => {
      const res = await profile('profileResponseSchema', {
        status: 'ok',
        data: { _id: 'p1' },
        extra: 'kept',
      });
      expect(res.data._id).toBe('p1');
      expect(res.extra).toBe('kept');
    });
  });

  describe('erp.schema.js', () => {
    it('accepts number or string money fields', async () => {
      const do1 = { _id: 'do1', doNumber: 'DO-1', quantity: 12, rate: '450.50' };
      expect((await erp('deliveryOrderSchema', do1)).rate).toBe('450.50');
      const do2 = { _id: 'do2', quantity: '12', rate: 450.5 };
      expect((await erp('deliveryOrderSchema', do2)).quantity).toBe('12');
    });

    it('rejects money fields that are neither number nor string', async () => {
      await expect(erp('deliveryOrderSchema', { quantity: { value: 1 } })).rejects.toThrow();
    });

    it('accepts each typed ERP entity with passthrough extras', async () => {
      expect((await erp('placementSchema', { doId: 'do1', note: 'x' })).note).toBe('x');
      expect((await erp('advanceSchema', { tripId: 't1', amount: 5000 })).amount).toBe(5000);
      expect((await erp('billSchema', { billNumber: 'B-1', amount: '9000' })).amount).toBe('9000');
    });

    it('erpListSchema accepts arrays of string-keyed records', async () => {
      expect(await erp('erpListSchema', [{ a: 1 }, { b: 'x', c: null }])).toHaveLength(2);
      await expect(erp('erpListSchema', 'not-an-array')).rejects.toThrow();
      await expect(erp('erpListSchema', [{ a: 1 }, 'nope'])).rejects.toThrow();
    });

    it('erpListResponseSchema unions the typed lists and validates meta', async () => {
      const res = await erp('erpListResponseSchema', {
        status: 'ok',
        data: [{ _id: 'do1' }, { _id: 'do2', whatever: true }],
        meta: { total: 2 },
      });
      expect(res.data).toHaveLength(2);

      // homogeneous bill list also passes
      const bills = await erp('erpListResponseSchema', { data: [{ _id: 'b1', amount: 1 }] });
      expect(bills.data[0]._id).toBe('b1');

      // meta fields are typed numbers
      await expect(
        erp('erpListResponseSchema', {
          data: [{ _id: 'do1' }],
          meta: { total: 'two' },
        }),
      ).rejects.toThrow();
    });
  });
});
