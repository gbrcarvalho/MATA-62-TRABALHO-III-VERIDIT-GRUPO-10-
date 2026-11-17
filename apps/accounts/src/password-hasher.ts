import { PasswordHasher } from "./interfaces/password-hasher.interface.js"

export class ConcretePasswordHasher implements PasswordHasher {
  hash(password: string) {
    return password
  }

  compare(password: string, hash: string) {
    return hash == this.hash(password)
  }
}
