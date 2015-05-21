
/*
 * This file exports a tests object to be used by test.js
 */

module.exports = {
   //   #/apps
   endpoint: 'apps',
   myResults: [
   {
      request: 'get',
      admin: 200,
      guest: 200,
      user: 200
   },
   {
      request: 'put',
      admin: 200,
      guest: 200,
      user: 200
   },
   {
      request: 'post',
      admin: 200,
      guest: 200,
      user: 200
   }],
   children: [
   {
      // #/apps/{id}
      myResults: [
      {
         request: 'put',
         admin: 200,
         guest: 200,
         user: 200
      },
      {
         request: 'head',
         admin: 200,
         guest: 200,
         user: 200
      },
      {
         request: 'get',
         admin: 200,
         guest: 200,
         user: 200
      },
      {
         request: 'delete',
         admin: 204,
         guest: 204,
         user: 204
      }],
      children: [
      {
         // #/apps/{id}/exists
         endpoint: 'exists',
         myResults: [
         {
            request: 'get',
            all: 200
         }]
      }]
   },
   {
      // #/apps/count
      endpoint: 'count',
      myResults: [
      {
         request: 'get',
         admin: 200,
         guest: 200,
         user: 200
      }]
   },
   {
      // #/apps/findOne
      endpoint: 'findOne',
      myResults: [
      {
         request: 'get',
         admin: 200,
         guest: 200,
         user: 200
      }]
   },
   {
      // #/apps/update
      endpoint: 'update',
      myResults: [
      {
         request: 'post',
         all: 500
      }]
   }]
};

