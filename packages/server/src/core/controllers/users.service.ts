import { Model, Document } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModel, RoleModel, VeryCodeModel } from './../interfaces';
import { MongooseService } from './../../common/services/mongoose.service';
import { RegisterReq } from './../../auth/dto/Register.dto';
import { LoginRes } from 'auth/dto/login.dto';
import { ObjectID } from 'typeorm';
import { EditProfileReq, ProfileRes } from './../dto';
import { ObjectId } from 'bson';

const FIVE_MINUTES = 5 * 60 * 1000; // 5 mins
const ONE_MINUTE = 1 * 60 * 1000; // 1 mins
const SMS_VERIFICATION_CONTENT = `sms template {0}`;

@Injectable()
export class UsersService extends MongooseService<UserModel> {

  defaultQueryFields = [
    'username',
    'avatar',
    'email',
    'name',
    'email',
    'mobile',
    'isAdmin',
    'isApproved',
    'expired',
  ];

  constructor(
    @InjectModel('User')
    protected readonly model: Model<UserModel>,
    @InjectModel('Profile')
    protected readonly profileModel: Model<UserModel>,
    @InjectModel('VeryCode')
    private readonly veryCodeModel: Model<VeryCodeModel>,
  ) {
    super(model);
  }

  async sendVeryCode(mobile: string): Promise<string> {
    const sms = await this.veryCodeModel.findOne({
      mobile,
      lastSent: {
        $gte: Date.now() - ONE_MINUTE
      }
    }).exec();
    if (sms && process.env.NODE_ENV !== 'test') {
      return Promise.reject("Request too often.");
    }
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      const date = Date.now();
      const code = "123456";
      await new this.veryCodeModel({ mobile, code, lastSent: date }).save();
      return Promise.resolve(code);
    }
    const code = "123456"; // + require("rander").between(100000, 999999);
    // const content = SMS_VERIFICATION_CONTENT.replace("{0}", code);
    // const result = await callSmsSent(mobile, content);
    // if (!result) return;
    await new this.veryCodeModel({ mobile, code }).save();
    return Promise.resolve(code);
  }

  async verifyCode(code: string, mobile: string): Promise<boolean> {
    return true; // TODO;
    const instance = await this.veryCodeModel.findOne({
      code,
      mobile,
      lastSent: {
        $gte: Date.now() - ONE_MINUTE
      }
    });
    return instance ? true : false;
  }

  async register(entry: RegisterReq): Promise<User> {
    entry.name = entry.name || entry.username;
    const { name, email, password, username, mobile, mobilePrefix } = entry;
    const instance = new this.model({
      name, email, password, username, mobile, mobilePrefix
    }); // only accept those fields
    return await instance.save();
  }

  async login(account: string, password: string): Promise<User | false> {
    const instance = await this.model.findOne({ username: account });
    if (instance) {
      return new Promise<User | false>((resolve, reject) => {
        instance.comparePassword(password, (err: Error, isMatch: boolean) => {
          if (err) { return reject(err); }
          if (isMatch) {
            resolve(instance);
          }
          resolve(false);
        });
      });
    }
    return false;
  }

  async findById(id: string | number | ObjectID): Promise<UserModel> {
    const user = await this.model.findById(id).exec();
    if (user) {
      user.name = user.name || user.username;
    }
    return user;
  }

  async removeUserFromRole(role: string, accountId: string) {
    if (role && accountId) {
      await this.model.update({
        _id: {
          $in: accountId
        }
      }, { $pullAll: { roles: [role] } }, { multi: true }).exec();
    }
    return true;
  }


  async addAccountsToRole(role: string, accountIds: string[] | string) {

    if (!Array.isArray(accountIds) && ObjectId.isValid(accountIds)) {
      accountIds = [accountIds];
    }

    if (role && Array.isArray(accountIds)) {
      const existIds = (await this.model.find({
        _id: {
          $in: accountIds
        },
        roles: {
          $in: [role]
        }
      }, { _id: 1 }).exec());

      const exists = (existIds || []).map((item: Document) => item._id.toString());
      const ids = accountIds.filter((id) => {
        return exists.indexOf(id) === -1;
      });

      const effects = await this.model.update({
        _id: {
          $in: ids
        }
      }, { $push: { roles: role } }, { multi: true }).exec();
    }

    return true;
  }

  async updateProfile(
    entry: EditProfileReq,
  ): Promise<ProfileRes> {

    // const { request } = context;
    // const profile: any = await Db.Profile.findOneAndUpdate(
    //   {
    //     _id: request.user.id,
    //   },
    //   entry, { upsert: true, new: true },
    // ).exec();

    // entry.profile = profile._id;
    // const account = await Db.Account.findOneAndUpdate(
    //   {
    //     _id: request.user.id,
    //   },
    //   entry, { new: true },
    // ).populate('profile').exec();

    // if (profile) {
    //   const instance = Repository.mergeProfile(account);
    //   return instance;
    // } else {
    //   throw new Errors.BadRequestError('user not found');
    // }

    return null; // TODO;
  }

}
