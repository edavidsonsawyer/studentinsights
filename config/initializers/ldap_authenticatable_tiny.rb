# This sets up a new Devise module for authenticating with an LDAP bind call.
Warden::Strategies.add(:ldap_authenticatable_tiny, Devise::Strategies::LdapAuthenticatableTiny)
Devise.add_module(:ldap_authenticatable_tiny, {
  :strategy  => true,
  :route => :session,
  :controller => :sessions
})
