// LiteLoader-AIDS automatic generated
/// <reference path="d:\software\BDS\llse/dts/HelperLib-master/src/index.d.ts"/> 

const plugin = {
    namespace: 'FakeChestLLSE',
    get name() { return this.namespace },
    intro: '在LLSE中简单使用假箱子!',
    vers: [0, 0, 1],
    author: 'Cdm2883'
};
ll.registerPlugin(
    plugin.name,
    plugin.intro,
    plugin.vers, {
        author: plugin.author
    });
(function showLogo() {
    let clr = (c, s = '$1') => `\x1b[${c}m${s}\x1b[0m`;
    let log = (s) => logger.info(`\r${s}`.replace(/([\\\|_/<])/g, clr('5;33;40')).replaceAll('$', clr('7;33;40', '#')));
    let sub = (s) => logger.info(`\r${s}`.padEnd(91, ' ').replace(/([\|_]| \. )/g, clr('32;40')).replace(/(v.+)/, clr(45)).replace(/(@.+)/, clr(44)));
    logger.setTitle('');
    logger.info('\r                                                                                              ');
    logger.info('\r                                                                                              ');
    log(String.raw`    $$$$$$$$\       $$\                   /$$$$$$  /$$                             /$$        `);
    log(String.raw`    $$  _____|      $$ |                 /$$__  $$| $$                            | $$        `);
    log(String.raw`    $$ |   $$$$$$\  $$ |  $$\  $$$$$$\  | $$  \__/| $$$$$$$   /$$$$$$   /$$$$$$$ /$$$$$$      `);
    log(String.raw`    $$$$$\ \____$$\ $$ | $$  |$$  __$$\ | $$      | $$__  $$ /$$__  $$ /$$_____/|_  $$_/      `);
    log(String.raw`    $$  __|$$$$$$$ |$$$$$$  / $$$$$$$$ || $$      | $$  \ $$| $$$$$$$$|  $$$$$$   | $$        `);
    log(String.raw`    $$ |  $$  __$$ |$$  _$$<  $$   ____|| $$    $$| $$  | $$| $$_____/ \____  $$  | $$ /$$    `);
    log(String.raw`    $$ |  \$$$$$$$ |$$ | \$$\ \$$$$$$$\ |  $$$$$$/| $$  | $$|  $$$$$$$ /$$$$$$$/  |  $$$$/    `);
    log(String.raw`    \__|   \_______|\__|  \__| \_______| \______/ |__/  |__/ \_______/|_______/    \___/      `);
    sub(String.raw`    .      .      _______ _______                                                             `);
    sub(String.raw`    |      |      |______ |______                                                             `);
    sub(String.raw`    |_____ |_____ ______| |______    v${plugin.vers.join('.')} @${plugin.author}              `);
    logger.info('\r                                                                                              ');
    logger.info('\r                                                                                              ');
    logger.setTitle(plugin.name);
})();

// todo:
// - 同时有多个箱子同时打开过快会出错
// - 支持不用关闭箱子, 更新箱子内容


// ==================== utils ====================

const getRuntimeIdOfChestBlock = (() => {
    const chestHashString = NativePointer.fromSymbol('?Chest@VanillaBlockTypeIds@@3VHashedString@@B');
    const getDefaultBlockStatefromSymbol = NativeFunction.fromSymbol('?getDefaultBlockState@BlockTypeRegistry@@SAAEBVBlock@@AEBVHashedString@@_N@Z');
    const getRuntimeIdfromSymbol = NativeFunction.fromSymbol('?getRuntimeId@Block@@QEBAAEBIXZ');
    return () => {
        // StaticVanillaBlocks::mChest->getRuntimeId()
        let chestptr = getDefaultBlockStatefromSymbol.call(chestHashString, true);
        return getRuntimeIdfromSymbol.call(chestptr).uint32;
    };
})();

const playerptr2llse = (() => {
    const getOrCreateUniqueID = NativeFunction.fromSymbol('?getOrCreateUniqueID@Actor@@QEBAAEBUActorUniqueID@@XZ');
    return (ptr) => {
        const uniqueId = getOrCreateUniqueID.call(ptr).long + '';
        return mc.getPlayer(uniqueId);
    };
})();

const nbtDeepCopy = (nbtCompound) => NBT.parseSNBT(nbtCompound.toSNBT());

const closeContainerNoTrigger = (player) => {
    const bs = new BinaryStream();
    bs.writeByte(0);
    bs.writeBool(true);
    let pkt = bs.createPacket(/*ContainerClose*/ 0x2F);
    onContainerCloseEnabled = false;
    player.sendPacket(pkt);
};

const callbackex = {
    call(...parms) {
        for (let i = 0; i < this.length; i++) {
            let func = this[i];
            if (func == null) continue;
            if(func(...parms)) this[i] = null;  // 返回真值停止监听
        }
        // this.forEach(func => func(...parms));
    },
    __proto__: []
};

/**
 * @param {IntPos} bpos 
 * @param {integer} runtimeId 
 * @param {integer} flag 
 * @param {integer} layer 
 * @see https://github.com/LiteLDev/LiteLoaderBDSv2/blob/c367ab7a45128033fdd0971a66099abe10bba003/LiteLoader/src/llapi/mc/PlayerAPI.cpp#L733
 */
LLSE_Player.prototype.sendUpdateBlockPacket = function ({x, y, z}, runtimeId,
    flag = /*UpdateBlockFlags::BlockUpdateAll*/ 3, layer = /*UpdateBlockLayer::UpdateBlockDefault*/ 0) {
    const bs = new BinaryStream();
    bs.writeVarInt(x);
    bs.writeUnsignedVarInt(y);
    bs.writeVarInt(z);
    bs.writeUnsignedVarInt(runtimeId);
    bs.writeUnsignedVarInt(flag);
    bs.writeUnsignedVarInt(layer);
    let pkt = bs.createPacket(/*UpdateBlock*/ 0x15);
    this.sendPacket(pkt);
}

Array.prototype.last = function () {
    return this.length === 0 ? undefined : this[this.length - 1];
}


// ==================== listener ====================

let onContainerCloseEnabled = true;
const onContainerClose = (() => {
    let callbacks = {__proto__: callbackex};

    let handleContainerClosePacket = NativeFunction.fromSymbol('?handle@ServerNetworkHandler@@UEAAXAEBVNetworkIdentifier@@AEBVContainerClosePacket@@@Z');
    const _getServerPlayer = NativeFunction.fromSymbol('?_getServerPlayer@ServerNetworkHandler@@EEAAPEAVServerPlayer@@AEBVNetworkIdentifier@@W4SubClientId@@@Z');
    handleContainerClosePacket = handleContainerClosePacket.hook((handler, id, packet) => {
        // https://github.com/LiteLDev/LiteLoaderBDSv2/blob/c367ab7a45128033fdd0971a66099abe10bba003/LiteLoader/include/llapi/mc/ServerNetworkHandler.hpp#L34
        let player = _getServerPlayer.call(handler.offset(-16), id, 0);
        player = playerptr2llse(player);
    
        if (onContainerCloseEnabled) callbacks.call(player);
        onContainerCloseEnabled = true;
    
        return handleContainerClosePacket.call(handler, id, packet);
    });

    return (callback) => callbacks.push(callback);
})();

const onItemTransfer = (() => {
    let callbacks = {__proto__: callbackex};

    let handleRequestAction = NativeFunction.fromSymbol('?handleRequestAction@ItemStackRequestActionHandler@@QEAA?AW4ItemStackNetResult@@AEBVItemStackRequestAction@@@Z');
    const getActionType = NativeFunction.fromSymbol('?getActionType@ItemStackRequestAction@@QEBA?AW4ItemStackRequestActionType@@XZ');
    const getDst = NativeFunction.fromSymbol('?getDst@ItemStackRequestActionTransferBase@@QEBAAEBUItemStackRequestSlotInfo@@XZ');
    const getSrc = NativeFunction.fromSymbol('?getSrc@ItemStackRequestActionTransferBase@@QEBAAEBUItemStackRequestSlotInfo@@XZ');
    const /*ItemStackRequestSlotInfo.*/getContainer = (ptr) => ({
             0: 'AnvilInputContainer'                 ,     1: 'AnvilMaterialContainer'              ,     2: 'AnvilResultPreviewContainer'         ,
             3: 'SmithingTableInputContainer'         ,     4: 'SmithingTableMaterialContainer'      ,     5: 'SmithingTableResultPreviewContainer' ,
             6: 'ArmorContainer'                      ,     7: 'LevelEntityContainer'                ,     8: 'BeaconPaymentContainer'              ,
             9: 'BrewingStandInputContainer'          ,    10: 'BrewingStandResultContainer'         ,    11: 'BrewingStandFuelContainer'           ,
            12: 'CombinedHotbarAndInventoryContainer' ,    13: 'CraftingInputContainer'              ,    14: 'CraftingOutputPreviewContainer'      ,
            15: 'RecipeConstructionContainer'         ,    16: 'RecipeNatureContainer'               ,    17: 'RecipeItemsContainer'                ,
            18: 'RecipeSearchContainer'               ,    19: 'RecipeSearchBarContainer'            ,    20: 'RecipeEquipmentContainer'            ,
            21: 'RecipeBookContainer'                 ,    22: 'EnchantingInputContainer'            ,    23: 'EnchantingMaterialContainer'         ,
            24: 'FurnaceFuelContainer'                ,    25: 'FurnaceIngredientContainer'          ,    26: 'FurnaceResultContainer'              ,
            27: 'HorseEquipContainer'                 ,    28: 'HotbarContainer'                     ,    29: 'InventoryContainer'                  ,
            30: 'ShulkerBoxContainer'                 ,    31: 'TradeIngredient1Container'           ,    32: 'TradeIngredient2Container'           ,
            33: 'TradeResultPreviewContainer'         ,    34: 'OffhandContainer'                    ,    35: 'CompoundCreatorInput'                ,
            36: 'CompoundCreatorOutputPreview'        ,    37: 'ElementConstructorOutputPreview'     ,    38: 'MaterialReducerInput'                ,
            39: 'MaterialReducerOutput'               ,    40: 'LabTableInput'                       ,    41: 'LoomInputContainer'                  ,
            42: 'LoomDyeContainer'                    ,    43: 'LoomMaterialContainer'               ,    44: 'LoomResultPreviewContainer'          ,
            45: 'BlastFurnaceIngredientContainer'     ,    46: 'SmokerIngredientContainer'           ,    47: 'Trade2Ingredient1Container'          ,
            48: 'Trade2Ingredient2Container'          ,    49: 'Trade2ResultPreviewContainer'        ,    50: 'GrindstoneInputContainer'            ,
            51: 'GrindstoneAdditionalContainer'       ,    52: 'GrindstoneResultPreviewContainer'    ,    53: 'StonecutterInputContainer'           ,
            54: 'StonecutterResultPreviewContainer'   ,    55: 'CartographyInputContainer'           ,    56: 'CartographyAdditionalContainer'      ,
            57: 'CartographyResultPreviewContainer'   ,    58: 'BarrelContainer'                     ,    59: 'CursorContainer'                     ,
            60: 'CreatedOutputContainer'              ,
        })[ptr/*.offset(0)*/.int8];
    const /*ItemStackRequestSlotInfo.*/getSlot = (ptr) => ptr.offset(1).uint8;
    handleRequestAction = handleRequestAction.hook((handler, action) => {
        const type = getActionType.call(action);
        const player = playerptr2llse(NativePointer.fromAddress(handler.int64));
        const result = handleRequestAction.call(handler, action);

        const types = {
            0x01: 'place',
            0x02: 'swap',
            0x03: 'drop'
        };
        let name = types[type];
        if (name == null) return result;

        let source = getSrc.call(action);
        let destination = getDst.call(action);
        callbacks.call(
            player, /*action*/name,
            {fromContainer: getContainer(source), fromSlot: getSlot(source)},
            {toContainer: name === 'drop' ? '' : getContainer(destination), toSlot: getSlot(destination)}
        );

        return result;
    });

    return (callback) => callbacks.push(callback);
})();


// ==================== FakeChest ====================

const activities = {
    activities: {/*uniqueId: [FakeChest...]*/},
    stack(player) {
        let uniqueId = player.uniqueId;
        if (!this.activities[uniqueId]) this.activities[uniqueId] = [];
        return this.activities[uniqueId];
    },
    push(player, activity) {
        return this.stack(player).push(activity);
    },
    pop(player) {
        return this.stack(player).pop();
    },
    last(player) {
        return this.stack(player).last();
    }
};

class FakeChest {
    static A_SIZE = 27;
    static EMPTY = new NbtCompound({
        Count: new NbtByte(0),
        Damage: new NbtShort(0),
        Name: new NbtString(''),
        WasPickedUp: new NbtByte(0)
    });

    #big = false;
    nbts = [
        new NbtCompound({
            CustomName: new NbtString('Chest'),
            Findable: new NbtByte(0),
            Items: new NbtList([]),
            id: new NbtString('Chest'),
            isMovable: new NbtByte(1),
            pairlead: new NbtByte(1)
        }),
        undefined
    ];
    pos = [];

    sourceCallbacks = {};
    transferCallback;
    closeCallback;

    constructor() {
        this.nbts[1] = nbtDeepCopy(this.nbts[0]);
        this.nbts[1].setTag('pairlead', new NbtByte(0));
    }
    copy() {
        let fakeChest = new FakeChest();
        fakeChest.#big = this.#big;

        fakeChest.nbts = new Array(this.nbts.length);
        for (let i = 0; i < this.nbts; i++) {
            let nbt = this.nbts[i];
            if (nbt != null) nbt = nbtDeepCopy(nbt);
            fakeChest.nbts[i] = nbt;
        }

        return fakeChest;
    }

    /** 获取容器拥有的格子总数 */
    get size() {
        return this.#big ? FakeChest.A_SIZE * 2 : FakeChest.A_SIZE;
    }

    /** 设置为大箱子 */
    big(size = true) {
        this.#big = size;
        return this;
    }
    /**
     * 设置箱子显示标题
     * @param {string} title 标题
     */
    setTitle(title) {
        title = new NbtString(title);
        this.nbts[0].setTag('CustomName', title);
        this.nbts[1].setTag('CustomName', title);
        return this;
    }

    #current(index) {
        // (
        //     this.#big
        //     && (index < 0 || index >= FakeChest.A_SIZE)
        //     && (index >= 0 || (this.size + index) >= FakeChest.A_SIZE)
        // ) ? 1 : 0
        let target = (
            (index >= 0 && index < FakeChest.A_SIZE)
            || (index < 0 && (this.size + index) < FakeChest.A_SIZE)
        ) ? 0 : 1;

        if (index >= FakeChest.A_SIZE) index -= FakeChest.A_SIZE;
        if (index == null) index = -1;
        if (index < 0) index = index + FakeChest.A_SIZE;
        if (index >= FakeChest.A_SIZE) index = FakeChest.A_SIZE - 1;

        return {target, index};
    }
    setItem(index, item = undefined, sourceCallback = undefined) {
        let current = this.#current(index);
        let items = this.nbts[current.target].getTag('Items');
        index = current.index;

        
        if (sourceCallback !== undefined) this.sourceCallbacks[
            current.target * FakeChest.A_SIZE + current.index
        ] = sourceCallback;


        if (item === undefined && items.getTag(index)) return this;

        if (!item) item = nbtDeepCopy(FakeChest.EMPTY);
        if (item.name != null) item = item.getNbt();
        if (typeof item == 'string') item = NBT.parseSNBT(item);
        item.setTag('Slot', new NbtByte(index));

        while (items.getSize() <= index)
            items.addTag(nbtDeepCopy(FakeChest.EMPTY)
                            .setByte('Slot', items.getSize()));

        items.setTag(index, item);

        for (let i = items.getSize() - 1; i >= 0; i--) {
            let nbt = items.getTag(i);
            if (nbt.getData('Count') == 0) items.removeTag(index);
            else break;
        }
        
        return this;
    }
    getItemNbt(index) {
        let current = this.#current(index);
        let items = this.nbts[current.target].getTag('Items');
        return items.getTag(current.index);
    }
    getItem(index) {
        let nbt = this.getItemNbt(index);
        if (nbt == null) return undefined;
        return mc.newItem(nbt);
    }

    // todo
    swap(from, to) {
        return this;
    }
    mergeItems(...chests) {
        chests = chests.flat();
        return this;
    }
    addItems(...chests) {
        chests = chests.flat();
        return this;
    }

    setTransferCallback(callback) {
        this.transferCallback = callback;
        return this;
    }
    setCloseCallback(callback) {
        this.closeCallback = callback;
        return this;
    }

    /**
     * 向玩家展示容器
     * @param {Player} player 玩家 
     */
    send(player) {
        let wait = 300;
        if (activities.last(player)) {
            wait = 1000;
            closeContainerNoTrigger(player);
        }

        let pos = player.blockPos;
        pos.y += 5;

        this.pos.push({x: pos.x , y: pos.y, z: pos.z});
        if (this.#big) this.pos.push({x: pos.x + 1, y: pos.y, z: pos.z});

        player.sendUpdateBlockPacket(pos, getRuntimeIdOfChestBlock());
        if (this.#big) player.sendUpdateBlockPacket({x: pos.x + 1, y: pos.y, z: pos.z}, getRuntimeIdOfChestBlock());

        function chestBlockEntityData(x, y, z, pairx, pairz, nbt) {
            nbt.setTag('x', new NbtInt(x));
            nbt.setTag('y', new NbtInt(y));
            nbt.setTag('z', new NbtInt(z));
            nbt.setTag('pairx', new NbtInt(pairx));
            nbt.setTag('pairz', new NbtInt(pairz));
            const bs = new BinaryStream();
            bs.writeVarInt(x);
            bs.writeUnsignedVarInt(y);
            bs.writeVarInt(z);
            bs.writeCompoundTag(nbt);
            var pkt = bs.createPacket(/*BlockActorData*/ 0x38);
            player.sendPacket(pkt);
        }
        chestBlockEntityData(pos.x, pos.y, pos.z, pos.x + 1, pos.z, this.nbts[0]);
        if (this.#big) chestBlockEntityData(pos.x + 1, pos.y, pos.z, pos.x, pos.z, this.nbts[1]);

        activities.push(player, this);
        setTimeout(() => {
            const bs = new BinaryStream();
            bs.writeByte(0);
            bs.writeByte(0);
            bs.writeVarInt(pos.x);
            bs.writeUnsignedVarInt(pos.y);
            bs.writeVarInt(pos.z);
            bs.writeVarInt64(-1);
            let pkt = bs.createPacket(/*ContainerOpen*/ 0x2E);
            player.sendPacket(pkt);
        }, wait);
    }
}

onContainerClose((player) => {
    /**/ let fakeChest = activities.pop(player);
    /**/ if (!fakeChest) return;

    // 懒得写只对箱子的位置进行更新了, 偷个懒awa
    // 但这样有个副作用, 刷新区块屏幕会闪一下.
    // 出问题之后再说吧awa
    player.refreshChunks();
    
    if (fakeChest.closeCallback)
        fakeChest.closeCallback(player);

    /**/ if (fakeChest = activities.pop(player))
    /**/     setTimeout(() => fakeChest.send(player), 300);
});
onItemTransfer((player, action, {fromContainer, fromSlot}, {toContainer, toSlot}) => {
    let fakeChest = activities.last(player);
    if (!fakeChest) return;

    const getItem = (container, slot) =>
                        container === 'LevelEntityContainer' ? fakeChest.getItem(slot) :
                        container === 'InventoryContainer' || container === 'HotbarContainer' ? player.getInventory().getItem(slot) :
                        undefined;
    const fromItem = getItem(fromContainer, fromSlot);
    const toItem = action === 'place' ? null :
                   action === 'drop'  ? undefined :
                   action === 'swap'  ? getItem(toContainer, toSlot) :
                   mc.newItem(nbtDeepCopy(FakeChest.EMPTY));
    const then = {
        close() {
            closeContainerNoTrigger(player);
        },
        update() {
            throw new Error('Stub!');
            // fakeChest.send();
        }
    };

    if (fakeChest.transferCallback) fakeChest.transferCallback(
            player, action,
            {fromContainer, fromSlot, fromItem},
            {toContainer, toSlot, toItem},
            then
        );
    
    let sourceCallback;
    if (fromContainer === 'LevelEntityContainer'
        && (sourceCallback = fakeChest.sourceCallbacks[fromSlot])
    ) sourceCallback(
        player, action,
        {fromContainer, fromSlot, fromItem},
        {toContainer, toSlot, toItem},
        then
    );
});


// ==================== export ====================

export default class exported extends FakeChest {
    static dev = {
        getRuntimeIdOfChestBlock,
        playerptr2llse,
        nbtDeepCopy,
        closeContainerNoTrigger,
        callbackex
    }
    static listener = {
        onContainerClose,
        onItemTransfer
    };
    static player = {
        sendUpdateBlockPacket: LLSE_Player.prototype.sendUpdateBlockPacket.call
    }
}