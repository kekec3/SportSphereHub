export class User {
    _id = '';
    username = '';
    role: 'sportista' | 'zaposleni' | 'admin' = 'sportista';
    firstName = '';
    lastName = '';
    email = '';
    phone = '';
    avatarUrl = '';
    favoriteSports: any[] = [];
    status = '';
}
