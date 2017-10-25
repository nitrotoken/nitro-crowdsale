'use strict';

class RpcError extends Error{
  constructor(message = '', code = 500){
    super(message);
    Object.assign(this, { code, message });
  }
  toJSON(){
    const { code, message } = this;
    return { code, message };
  }
}

/**
 * @swagger
 * definitions:
 *   InternalError:
 *     type: object
 *     properties:
 *       code:
 *         type: integer
 *         format: int32
 *         example: 500
 *       message:
 *         type: string
 *         example: Internal error
 */
class InternalError extends RpcError{
  constructor(){
    super('Internal error', 500);
  }
}

Object.assign(exports, {
  RpcError,
  InternalError
});