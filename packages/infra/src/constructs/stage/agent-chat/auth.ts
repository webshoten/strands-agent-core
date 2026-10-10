import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/** ブラウザのユーザー認証に使用するCognitoリソースを作成する。 */
export class Auth extends Construct {
  readonly userPool: cognito.UserPool;
  readonly webUserPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      mfa: cognito.Mfa.OFF,
    });

    this.webUserPoolClient = this.userPool.addClient("WebUserPoolClient", {
      authFlows: {
        userSrp: true,
      },
      disableOAuth: true,
      generateSecret: false,
    });
  }
}
