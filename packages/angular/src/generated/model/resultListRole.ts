/**
 * rest api interface
 * 项目标准接口
 *
 * OpenAPI spec version: 0.0.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Query } from './query';
import { Role } from './role';


/**
 * 
 */
export interface ResultListRole { 
    /**
     * 
     */
    list: Array<Role>;
    /**
     * 
     */
    count?: number;
    query?: Query;
}
