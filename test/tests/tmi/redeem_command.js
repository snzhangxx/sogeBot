const { getBotSender } = require('../../../dest/helpers/commons/getBotSender');

require('../../general.js');

const until = require('test-until');

const cheer = (require('../../../dest/helpers/events/cheer')).cheer;
const translate = require('../../../dest/translate').translate;
const db = require('../../general.js').db;
const message = require('../../general.js').message;
const time = require('../../general.js').time;
const { Price } = require('../../../dest/database/entity/price');
const customcommands = (require('../../../dest/systems/customcommands')).default;

const { getLocalizedName } = require('@sogebot/ui-helpers/getLocalized');

const assert = require('assert');

const { AppDataSource } = require('../../../dest/database');

const owner = { userName: '__broadcaster__', user_id: String(Math.floor(Math.random() * 10000)) };

describe('TMI - redeem command - @func3', () => {
  before(async () => {
    await db.cleanup();
    await time.waitMs(1000);
    await message.prepare();
  });

  it('Add custom command !test', async () => {
    const r = await customcommands.add({ sender: owner, parameters: '-c !test -r Lorem Ipsum' });
    assert.strictEqual(r[0].response, '$sender, command !test was added');
    const r2 = await customcommands.add({ sender: owner, parameters: '-c !test2 -r Ipsum Lorem' });
    assert.strictEqual(r2[0].response, '$sender, command !test2 was added');
  });

  it(`Add price !test with emitRedeemEvent`, async () => {
    await AppDataSource.getRepository(Price).save({
      command: '!test', price: 0, priceBits: 10, emitRedeemEvent: true,
    });
  });

  it(`Add price !test2 without emitRedeemEvent`, async () => {
    await AppDataSource.getRepository(Price).save({
      command: '!test2', price: 0, priceBits: 10, emitRedeemEvent: false,
    });
  });

  it(`User will cheer !test with 5 bits (not enough)`, async () => {
    cheer({
      user_login: 'testuser',
      user_id:    String(Math.floor(Math.random() * 100000)),
      message:    '!test',
      bits:       5,
    });
  });

  it(`User will cheer !test2 with 5 bits (not enough)`, async () => {
    cheer({
      user_login: 'testuser',
      user_id:    String(Math.floor(Math.random() * 100000)),
      message:    '!test2',
      bits:       5,
    });
  });

  it(`Command !test was not redeemed`, async () => {
    try {
      await message.debug('tmi.cmdredeems', '!test');
      assert(false, 'This should not get here');
    } catch (e) {
      return;
    }
  });

  it(`Command !test2 was not redeemed`, async () => {
    try {
      await message.debug('tmi.cmdredeems', '!test2');
      assert(false, 'This should not get here');
    } catch (e) {
      return;
    }
  });

  it(`User will cheer !test with 10 bits (enough)`, async () => {
    cheer({
      user_login: 'testuser',
      user_id:    String(Math.floor(Math.random() * 100000)),
      message:    '!test',
      bits:       10,
    });
  });

  it(`User will cheer !test2 with 10 bits (enough)`, async () => {
    cheer({
      user_login: 'testuser',
      user_id:    String(Math.floor(Math.random() * 100000)),
      message:    '!test2',
      bits:       10,
    });
  });

  it(`Command was !test redeemed`, async () => {
    await message.isSentRaw('Lorem Ipsum', 'testuser');
    await message.debug('tmi.cmdredeems', '!test');
  });

  it(`Command !test2 was redeemed but without alert`, async () => {
    await message.isSentRaw('Ipsum Lorem', 'testuser');
    try {
      await message.debug('tmi.cmdredeems', '!test2');
      assert(false, 'This should not get here');
    } catch (e) {
      return;
    }
  });
});
