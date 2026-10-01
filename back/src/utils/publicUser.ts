export function publicUser(u: any) {
    return {
        _id: u._id, username: u.username, role: u.role,
        firstName: u.firstName, lastName: u.lastName,
        email: u.email, phone: u.phone, avatarUrl: u.avatarUrl,
        favoriteSports: u.favoriteSports, status: u.status
    }
}
