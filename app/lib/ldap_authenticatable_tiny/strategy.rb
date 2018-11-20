module Devise
  module Strategies
    class LdapAuthenticatableTiny < Authenticatable
      # This is the entry point, and we wrap it to prevent timing attacks
      # that could result from the different execution times of the different
      # code paths.
      def authenticate!
        desired_milliseconds = parse_desired_milliseconds()
        ConsistentTiming.new.enforce_timing(desired_milliseconds) do
          authenticate_without_consistent_timing!
        end
      end

      private
      def parse_desired_milliseconds
        default_value_in_milliseconds = 10000
        desired_milliseconds = ENV.fetch('CONSISTENT_TIMING_FOR_LOGIN_IN_MILLISECONDS', default_value_in_milliseconds.to_s).to_i
        return default_value_in_milliseconds if desired_milliseconds == 0
        desired_milliseconds
      end

      # Check that we have that user in the database, then check
      # credentials against LDAP, and return success if both succeed.
      # This method ultimately calls `fail` or `success!`
      #
      # `authentication_hash` and `password` methods are provided by the superclass:
      # https://github.com/plataformatec/devise/blob/master/lib/devise/strategies/authenticatable.rb
      #
      # Also check out Devise's Authenticable Model and Warden's base Strategy to
      # see what's going on here.
      # https://github.com/wardencommunity/warden/blob/master/lib/warden/strategies/base.rb#L8
      # https://github.com/plataformatec/devise/blob/master/lib/devise/models/authenticatable.rb
      def authenticate_without_consistent_timing!
        begin
          # Get parameters user sent via superclass, and validate them.
          # Devise also enforces taht all parameters are present before our strategy runs.
          login_text = authentication_hash.fetch(:login_text, '').downcase.strip
          login_code = authentication_hash.fetch(:login_code, '').downcase.strip
          password_text = password()
          if login_text.empty? || login_code.empty? || password_text.empty?
            Rollbar.error('LdapAuthenticatableTiny called with invalid params')
            logger.error 'LdapAuthenticatableTiny  called with invalid params'
            return fail!(:invalid)
          end

          # First, see if we can find an Educator record
          educator = PerDistrict.new.find_educator_by_login_text(login_text)
          return fail!(:not_found_in_database) unless educator.present?

          # Next, check if we got an actual multifactor code.
          # If they have multifactor enabled, check the code, if they don't fail unless
          # this is an expected placeholder value (we need to pass something for Devise interop).
          if is_multifactor_required?(educator)
            return fail!(:invalid_multifactor) unless is_multifactor_code_valid?(educator, login_code)
          elsif !is_placeholder_multifactor_login_code?(login_code)
            return fail!(:unexpected_multifactor)
          end

          # Finally, try asking the LDAP server if they have access
          ldap_login = PerDistrict.new.ldap_login_for_educator(educator)
          return fail!(:invalid) unless is_authorized_by_ldap?(ldap_login, password_text)

          # Success
          return success!(educator)
        rescue => error
          Rollbar.error('LdapAuthenticatableTiny error caught', error)
          logger.error "LdapAuthenticatableTiny, error caught: #{error}"
          return fail!(:error)
        end
        nil
      end

      def is_multifactor_required?(educator)
        MultifactorAuthenticator.new(educator).is_multifactor_required?
      end

      def is_multifactor_code_valid?(educator, login_code)
        MultifactorAuthenticator.new(educator).is_multifactor_code_valid?(login_code)
      end

      # Devise requires that a value is always sent
      def is_placeholder_multifactor_login_code?(login_code)
         login_code.downcase.strip == 'no_code'
      end

      def is_authorized_by_ldap?(ldap_login, password_text)
        LdapAuthenticator.new(logger: logger).is_authorized_by_ldap?(ldap_login, password_text)
      end

      def logger
        Rails.logger
      end
    end
  end
end
