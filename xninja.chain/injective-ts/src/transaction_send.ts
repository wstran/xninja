import { config } from "dotenv";
import { Network } from "@injectivelabs/networks";
import { MsgExecuteContractCompat, PrivateKey } from "@injectivelabs/sdk-ts";
import { MsgSend } from "@injectivelabs/sdk-ts";
import { BigNumberInBase } from "@injectivelabs/utils";
import { MsgBroadcasterWithPk } from "@injectivelabs/sdk-ts";
import MsgExec from "@injectivelabs/sdk-ts/dist/cjs/core/modules/authz/msgs/MsgExec";

config();

// MINT_COMMAND='{"mint":{"recipient":"'$(echo $RECIPIENT)'","amount":"1000000000000000000000000"}}'

/** MsgSend Example */
(async () => {
  const contractAddress = process.env.ELEM_CONTRACT_ADDRESS as string;

  const privateKeyHash = process.env.PRIVATE_KEY_1 as string;
  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const grantee = injectiveAddress;

  const privateKeyHash2 = process.env.PRIVATE_KEY_2 as string;
  const privateKey2 = PrivateKey.fromHex(privateKeyHash2);
  const injectiveAddress_2 = privateKey2.toBech32();
  const granter = injectiveAddress;

  /** Prepare the Message */
  const amount = {
    denom: "inj",
    amount: new BigNumberInBase(1).toWei().toFixed(),
  };

  const msg = MsgSend.fromJSON({
    amount,
    srcInjectiveAddress: injectiveAddress,
    dstInjectiveAddress: injectiveAddress_2,
  });

  const msgBroadcaster = new MsgBroadcasterWithPk({
    network: Network.Testnet,
    privateKey: privateKeyHash,
  });

  /** Prepare the Transaction **/
  const response = await msgBroadcaster.broadcast({ msgs: msg });

  console.log(response);
})();
