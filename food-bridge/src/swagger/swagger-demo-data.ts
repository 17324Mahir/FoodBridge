import { randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { DataSource } from 'typeorm';
import { CollectionAssignment } from '../assignments/entities/collection-assignment.entity.js';
import { AssignmentStatus } from '../common/assignment-status.enum.js';
import { DeliveryStatus } from '../common/delivery-status.enum.js';
import { MembershipStatus } from '../common/membership-status.enum.js';
import { ReservationStatus } from '../common/reservation-status.enum.js';
import { UserRole } from '../common/user-role.enum.js';
import { DeliveryRecord } from '../delivery-records/entities/delivery-record.entity.js';
import { DonationStatus } from '../donations/donation-status.enum.js';
import { DonationUnit } from '../donations/donation-unit.enum.js';
import { Donation } from '../donations/entities/donation.entity.js';
import { DonorProfile } from '../donor-profile/entities/donor-profile.entity.js';
import { FoodCategory } from '../food-categories/entities/food-category.entity.js';
import { NgoProfile } from '../ngo-profile/entities/ngo-profile.entity.js';
import { NgoVolunteer } from '../ngo-volunteers/entities/ngo-volunteer.entity.js';
import {
  Organization,
  OrganizationKind,
  OrganizationStatus,
} from '../organizations/entities/organization.entity.js';
import { Reservation } from '../reservations/entities/reservation.entity.js';
import { User } from '../users/entities/user.entity.js';
import { VolunteerAvailability } from '../volunteer-profile/entities/volunteer-availability.entity.js';
import { VolunteerProfile } from '../volunteer-profile/entities/volunteer-profile.entity.js';

export async function seedSwaggerDemo(dataSource: DataSource) {
  const run = randomBytes(6).toString('hex');
  const password = `Demo-${randomBytes(12).toString('hex')}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const phonePrefix = String(randomInt(10 ** 9)).padStart(9, '0');
  let nextPhoneSuffix = 1;

  function identity(slug: string, name: string) {
    return {
      name,
      email: `${slug}.${run}@example.com`,
      phone: `+8801${phonePrefix}${nextPhoneSuffix++}`,
      address: 'Dhanmondi, Dhaka',
    };
  }

  // Each startup creates a fresh run. Earlier demo data remains available in PostgreSQL.
  return dataSource.transaction(async (manager) => {
    async function account(
      slug: string,
      name: string,
      role: UserRole,
      verificationStatus = 'VERIFIED',
    ) {
      const { address, ...contact } = identity(slug, name);
      const { userId } = await manager.save(User, {
        ...contact,
        role,
        password: passwordHash,
      });
      switch (role) {
        case UserRole.DONOR:
          await manager.save(DonorProfile, { userId, address });
          break;
        case UserRole.NGO:
          await manager.save(NgoProfile, {
            userId,
            address,
            verificationStatus,
            regNo: `FB-${slug}-${run}`,
          });
          break;
        case UserRole.VOLUNTEER:
          await manager.save(VolunteerProfile, { userId, address });
          break;
      }
      return { userId, name, email: contact.email };
    }

    const admin = await account('admin', 'Demo Admin', UserRole.ADMIN);
    const donor = await account('donor', 'Sunrise Kitchen', UserRole.DONOR);
    const organization = await manager.save(Organization, {
      name: donor.name,
      kind: OrganizationKind.DONOR,
      status: OrganizationStatus.APPROVED,
    });
    await manager.update(User, donor.userId, {
      organizationId: organization.id,
    });
    const pendingDonor = await account(
      'pending-donor',
      'New Community Kitchen',
      UserRole.DONOR,
    );
    const ngo = await account('ngo', 'Dhaka Food Aid', UserRole.NGO);
    const volunteer = await account(
      'volunteer',
      'Amina Rahman',
      UserRole.VOLUNTEER,
    );
    const pendingNgo = await account(
      'pending-ngo',
      'Community Food Centre',
      UserRole.NGO,
      'PENDING',
    );
    const accountToClose = await account(
      'close-account',
      'Demo Donor for Account Closure',
      UserRole.DONOR,
    );
    const userForAdmin = await account(
      'delete-user',
      'Demo User for Admin Deletion',
      UserRole.DONOR,
    );
    const volunteerToClose = await account(
      'close-volunteer',
      'Demo Volunteer for Account Closure',
      UserRole.VOLUNTEER,
    );
    const volunteerForAdmin = await account(
      'delete-volunteer',
      'Demo Volunteer for Admin Deletion',
      UserRole.VOLUNTEER,
    );
    const volunteerToInvite = await account(
      'invite-volunteer',
      'Nadia Islam',
      UserRole.VOLUNTEER,
    );
    const volunteerToAccept = await account(
      'accept-invite',
      'Samira Khan',
      UserRole.VOLUNTEER,
    );
    const volunteerToDecline = await account(
      'decline-invite',
      'Omar Hasan',
      UserRole.VOLUNTEER,
    );
    const volunteerToRemove = await account(
      'remove-membership',
      'Fariha Ahmed',
      UserRole.VOLUNTEER,
    );

    const weekdaySlot = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' };
    await manager.save(VolunteerAvailability, {
      volunteerId: volunteer.userId,
      ...weekdaySlot,
    });

    const [category, categoryToEdit, categoryToDelete] = await manager.save(
      FoodCategory,
      [
        { name: `Prepared Meals (${run})` },
        { name: `Pantry Items (${run})` },
        { name: `Unused Category (${run})` },
      ],
    );
    const donationTerms = {
      categoryId: category.id,
      quantity: '20',
      unit: DonationUnit.BOXES,
      pickupAddress: 'Gate 2, Sunrise Kitchen',
      area: 'Dhanmondi',
      availableFrom: new Date(now.getTime() - 5 * 60_000),
      pickupDeadline: new Date(now.getTime() + 24 * 60 * 60_000),
      declaredUseByAt: new Date(now.getTime() + 26 * 60 * 60_000),
    };

    function donation(title: string, status: DonationStatus) {
      return manager.save(Donation, {
        ...donationTerms,
        donorUserId: donor.userId,
        donorOrganizationId: organization.id,
        title,
        status,
      });
    }

    function membership(volunteerId: string, status: MembershipStatus) {
      return manager.save(NgoVolunteer, {
        ngoId: ngo.userId,
        volunteerId,
        status,
        invitedAt: now,
        acceptedAt: status === MembershipStatus.ACTIVE ? now : null,
      });
    }

    const activeMembership = await membership(
      volunteer.userId,
      MembershipStatus.ACTIVE,
    );
    const invitationToAccept = await membership(
      volunteerToAccept.userId,
      MembershipStatus.INVITED,
    );
    const invitationToDecline = await membership(
      volunteerToDecline.userId,
      MembershipStatus.INVITED,
    );
    const membershipToRemove = await membership(
      volunteerToRemove.userId,
      MembershipStatus.ACTIVE,
    );

    async function reservation(
      title: string,
      status = ReservationStatus.RESERVED,
    ) {
      const item = await donation(title, DonationStatus.RESERVED);
      return manager.save(Reservation, {
        donationId: item.id,
        ngoId: ngo.userId,
        reservedAt: now,
        status,
      });
    }

    async function assignment(
      title: string,
      reservationStatus = ReservationStatus.RESERVED,
    ) {
      const saved = await reservation(title, reservationStatus);
      const offered = reservationStatus === ReservationStatus.RESERVED;
      return manager.save(CollectionAssignment, {
        reservationId: saved.id,
        membershipId: activeMembership.id,
        status: offered ? AssignmentStatus.OFFERED : AssignmentStatus.ACCEPTED,
        assignedAt: now,
        acceptedAt: offered ? null : now,
      });
    }

    const deliveryBody = {
      deliveredQuantity: '20',
      recipientName: 'Dhanmondi Community Center',
    };

    async function reportedDelivery(title: string) {
      const assigned = await assignment(title, ReservationStatus.PICKED_UP);
      return manager.save(DeliveryRecord, {
        ...deliveryBody,
        reservationId: assigned.reservationId,
        assignmentId: assigned.id,
        reportedById: volunteer.userId,
        reportedAt: now,
        status: DeliveryStatus.REPORTED,
      });
    }

    const draft = await donation(
      'Vegetable rice boxes to publish',
      DonationStatus.DRAFT,
    );
    const archiveDraft = await donation(
      'Unused draft for archiving',
      DonationStatus.DRAFT,
    );
    const toWithdraw = await donation(
      'Rice boxes to withdraw',
      DonationStatus.AVAILABLE,
    );
    const toReserve = await donation(
      'Rice boxes ready for reservation',
      DonationStatus.AVAILABLE,
    );
    const toAssign = await reservation('Rice boxes ready for assignment');
    const toCancel = await reservation(
      'Rice boxes with a cancelled pickup plan',
    );
    const offerToAccept = await assignment(
      'Rice boxes with an offer to accept',
    );
    const offerToDecline = await assignment(
      'Rice boxes with an offer to decline',
    );
    const offerToCancel = await assignment(
      'Rice boxes with an offer to cancel',
    );
    const toPickUp = await assignment(
      'Rice boxes ready for pickup',
      ReservationStatus.ASSIGNED,
    );
    const toReport = await assignment(
      'Collected rice boxes ready for delivery report',
      ReservationStatus.PICKED_UP,
    );
    const toConfirm = await reportedDelivery('Delivery awaiting confirmation');
    const toDispute = await reportedDelivery(
      'Delivery with a quantity mismatch',
    );

    return {
      password,
      accounts: {
        admin,
        donor,
        ngo,
        volunteer,
        accountToClose,
        volunteerToClose,
        volunteerToAccept,
        volunteerToDecline,
      },
      pendingNgo,
      pendingDonor,
      userForAdmin,
      volunteerForAdmin,
      volunteerToInvite,
      weekdaySlot,
      registration: {
        donor: { ...identity('register-donor', 'New Demo Donor'), password },
        ngo: {
          ...identity('register-ngo', 'New Demo NGO'),
          regNo: `FB-new-${run}`,
          password,
        },
        volunteer: {
          ...identity('register-volunteer', 'New Demo Volunteer'),
          password,
        },
      },
      category,
      categoryToEdit,
      categoryToDelete,
      categoryName: `Community Meals (${run})`,
      donationBody: {
        ...donationTerms,
        title: 'Vegetable rice meal boxes',
        availableFrom: donationTerms.availableFrom.toISOString(),
        pickupDeadline: donationTerms.pickupDeadline.toISOString(),
        declaredUseByAt: donationTerms.declaredUseByAt.toISOString(),
      },
      draft,
      archiveDraft,
      toWithdraw,
      toReserve,
      toAssign,
      toCancel,
      activeMembership,
      invitationToAccept,
      invitationToDecline,
      membershipToRemove,
      offerToAccept,
      offerToDecline,
      offerToCancel,
      toPickUp,
      toReport,
      toConfirm,
      toDispute,
      deliveryBody,
    };
  });
}
